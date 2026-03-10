import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import db from "../../data/db.json";
import styles from "./Menu.module.css";
import Button from "../../components/ui/Button/Button";

import ProductCard from "./components/ProductCard";
import SearchBar from "./components/SearchBar";
import CategoryFilters from "./components/CategoryFilters";
import ProductModal from "./components/ProductModal";
import CartDrawer from "./components/CartDrawer";

const CART_STORAGE_KEY = "base-studio-pizzas-cart";

function formatPrice(value) {
  if (value == null) return null;

  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

function normalizeText(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

export default function Menu() {
  const { cardapio } = db;
  const location = useLocation();
  const didPreselectRef = useRef(false);

  const [activeCategory, setActiveCategory] = useState("all");
  const [search, setSearch] = useState("");
  const [cartItems, setCartItems] = useState([]);
  const [cartOpen, setCartOpen] = useState(false);

  const [selectedProduct, setSelectedProduct] = useState(null);
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [notes, setNotes] = useState("");
  const [withoutOnion, setWithoutOnion] = useState(false);
  const [withoutTomato, setWithoutTomato] = useState(false);
  const [withoutOlive, setWithoutOlive] = useState(false);

  const baseProducts = useMemo(() => {
    return (cardapio?.pizzas ?? []).filter((item) => item.active);
  }, [cardapio]);

  const products = useMemo(() => {
    let filtered = baseProducts;

    if (activeCategory !== "all") {
      filtered = filtered.filter((item) => item.categoryId === activeCategory);
    }

    if (search.trim()) {
      const term = normalizeText(search);

      filtered = filtered.filter((item) => {
        const name = normalizeText(item.name);
        const description = normalizeText(item.description);
        const tag = normalizeText(item.tag);

        return (
          name.includes(term) ||
          description.includes(term) ||
          tag.includes(term)
        );
      });
    }

    return filtered;
  }, [baseProducts, activeCategory, search]);

  const activeCategoryName = useMemo(() => {
    if (activeCategory === "all") return "Todas";

    return (
      cardapio?.categories?.find((category) => category.id === activeCategory)
        ?.name || "Categoria"
    );
  }, [activeCategory, cardapio]);

  const cartCount = useMemo(
    () => cartItems.reduce((acc, item) => acc + item.quantity, 0),
    [cartItems]
  );

  const subtotal = useMemo(
    () => cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0),
    [cartItems]
  );

  const deliveryFee = cartItems.length > 0 ? 6.9 : 0;
  const total = subtotal + deliveryFee;

  function resetProductOptions() {
    setNotes("");
    setWithoutOnion(false);
    setWithoutTomato(false);
    setWithoutOlive(false);
  }

  function handleOpenProductModal(product) {
    setSelectedProduct(product);
    resetProductOptions();
    setProductModalOpen(true);
  }

  function handleCloseProductModal() {
    setProductModalOpen(false);
    setSelectedProduct(null);
    resetProductOptions();
  }

  function handleConfirmProduct() {
    if (!selectedProduct) return;

    const removedIngredients = [
      withoutOnion ? "Sem cebola" : null,
      withoutTomato ? "Sem tomate" : null,
      withoutOlive ? "Sem azeitona" : null,
    ].filter(Boolean);

    const trimmedNotes = notes.trim();

    setCartItems((prev) => [
      ...prev,
      {
        id: `${selectedProduct.id}-${Date.now()}`,
        productId: selectedProduct.id,
        name: selectedProduct.name,
        price: selectedProduct.price,
        image: selectedProduct.image,
        quantity: 1,
        notes: trimmedNotes,
        removedIngredients,
      },
    ]);

    handleCloseProductModal();
    setCartOpen(true);
  }

  function handleDecrease(cartItemId) {
    setCartItems((prev) =>
      prev
        .map((item) =>
          item.id === cartItemId
            ? { ...item, quantity: item.quantity - 1 }
            : item
        )
        .filter((item) => item.quantity > 0)
    );
  }

  function handleIncrease(cartItemId) {
    setCartItems((prev) =>
      prev.map((item) =>
        item.id === cartItemId
          ? { ...item, quantity: item.quantity + 1 }
          : item
      )
    );
  }

  function handleRemove(cartItemId) {
    setCartItems((prev) => prev.filter((item) => item.id !== cartItemId));
  }

  function handleClearSearch() {
    setSearch("");
  }

  useEffect(() => {
    document.body.style.overflow = cartOpen || productModalOpen ? "hidden" : "";

    return () => {
      document.body.style.overflow = "";
    };
  }, [cartOpen, productModalOpen]);

  useEffect(() => {
    function handleEsc(event) {
      if (event.key === "Escape") {
        if (productModalOpen) handleCloseProductModal();
        if (cartOpen) setCartOpen(false);
      }
    }

    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [cartOpen, productModalOpen]);

  useEffect(() => {
    try {
      const savedCart = localStorage.getItem(CART_STORAGE_KEY);
      if (!savedCart) return;

      const parsedCart = JSON.parse(savedCart);

      if (Array.isArray(parsedCart)) {
        setCartItems(parsedCart);
      }
    } catch (error) {
      console.error("Erro ao carregar carrinho do localStorage:", error);
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartItems));
    } catch (error) {
      console.error("Erro ao salvar carrinho no localStorage:", error);
    }
  }, [cartItems]);

  useEffect(() => {
    const openProductId = location.state?.openProductId;

    if (!openProductId) return;
    if (didPreselectRef.current) return;

    const selectedPizza = (cardapio?.pizzas ?? []).find(
      (pizza) => pizza.id === openProductId
    );

    if (!selectedPizza) return;

    didPreselectRef.current = true;

    setActiveCategory("all");
    setSelectedProduct(selectedPizza);
    resetProductOptions();
    setProductModalOpen(true);
  }, [location.state, cardapio]);

  return (
    <>
      <main className={styles.page}>
        <section className={styles.hero}>
          <div className={styles.heroContent}>
            <span className={styles.kicker}>Cardápio digital</span>
            <h1 className={styles.title}>Nosso cardápio</h1>
            <p className={styles.subtitle}>
              Escolha sua pizza favorita, filtre por categoria e monte seu pedido
              com rapidez.
            </p>

            <SearchBar
              value={search}
              onChange={setSearch}
              onClear={handleClearSearch}
            />
          </div>
        </section>

        <section className={styles.filtersSection}>
          <div className={styles.exploreCard}>
            <CategoryFilters
              categories={cardapio?.categories ?? []}
              activeCategory={activeCategory}
              onChangeCategory={setActiveCategory}
            />

            <div className={styles.resultsBar}>
              <p className={styles.resultsText}>
                Mostrando <strong>{products.length}</strong>{" "}
                {products.length === 1 ? "pizza" : "pizzas"} • Categoria:{" "}
                <strong>{activeCategoryName}</strong>
                {search ? (
                  <>
                    {" "}• Busca: <strong>“{search}”</strong>
                  </>
                ) : null}
              </p>
            </div>
          </div>
        </section>

        <section className={styles.catalogSection}>
          {products.length === 0 ? (
            <div className={styles.emptyCatalog}>
              <div className={styles.emptyCatalogIcon}>🍕</div>
              <h2>Nenhuma pizza encontrada</h2>
              <p>
                Tente buscar por outro nome ou escolha uma categoria diferente.
              </p>

              <div className={styles.emptyCatalogActions}>
                <Button
                  type="button"
                  variant="ghost"
                  size="md"
                  onClick={() => {
                    setSearch("");
                    setActiveCategory("all");
                  }}
                >
                  Limpar filtros
                </Button>
              </div>
            </div>
          ) : (
            <div className={styles.grid}>
              {products.map((item) => (
                <ProductCard
                  key={item.id}
                  item={item}
                  onOpenModal={handleOpenProductModal}
                  formatPrice={formatPrice}
                />
              ))}
            </div>
          )}
        </section>
      </main>

      <button
        type="button"
        className={`${styles.floatingCart} ${
          cartCount > 0 ? styles.floatingCartVisible : styles.floatingCartEmpty
        }`}
        onClick={() => setCartOpen(true)}
        aria-label={`Abrir carrinho com ${cartCount} item(ns)`}
      >
        <span className={styles.floatingCartIcon} aria-hidden="true">
          🛒
        </span>

        <div className={styles.floatingCartInfo}>
          <strong className={styles.floatingCartTitle}>Ver carrinho</strong>
          <span className={styles.floatingCartMeta}>
            {cartCount} {cartCount === 1 ? "item" : "itens"} • {formatPrice(total)}
          </span>
        </div>

        <span className={styles.floatingCartCount}>{cartCount}</span>
      </button>

      <ProductModal
        open={productModalOpen}
        product={selectedProduct}
        notes={notes}
        setNotes={setNotes}
        withoutOnion={withoutOnion}
        setWithoutOnion={setWithoutOnion}
        withoutTomato={withoutTomato}
        setWithoutTomato={setWithoutTomato}
        withoutOlive={withoutOlive}
        setWithoutOlive={setWithoutOlive}
        onClose={handleCloseProductModal}
        onConfirm={handleConfirmProduct}
        formatPrice={formatPrice}
      />

      <CartDrawer
        open={cartOpen}
        cartItems={cartItems}
        cartCount={cartCount}
        subtotal={subtotal}
        deliveryFee={deliveryFee}
        total={total}
        onClose={() => setCartOpen(false)}
        onDecrease={handleDecrease}
        onIncrease={handleIncrease}
        onRemove={handleRemove}
        formatPrice={formatPrice}
      />
    </>
  );
}