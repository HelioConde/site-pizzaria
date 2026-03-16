import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabase";
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
  }).format(Number(value) || 0);
}

function normalizeText(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function isPizzaCategory(category) {
  const slug = normalizeText(category?.slug);
  const name = normalizeText(category?.name);

  return (
    slug === "tradicionais" ||
    slug === "especiais" ||
    slug.includes("pizza") ||
    name.includes("pizza") ||
    name.includes("tradicional") ||
    name.includes("tradicionais") ||
    name.includes("especial") ||
    name.includes("especiais")
  );
}

function isCustomizableProduct(product) {
  const categorySlug = normalizeText(product?.categorySlug);
  const categoryName = normalizeText(product?.categoryName);
  const name = normalizeText(product?.name);

  return (
    product?.isCustomizable === true ||
    categorySlug === "tradicionais" ||
    categorySlug === "especiais" ||
    categorySlug.includes("pizza") ||
    categoryName.includes("pizza") ||
    categoryName.includes("tradicional") ||
    categoryName.includes("tradicionais") ||
    categoryName.includes("especial") ||
    categoryName.includes("especiais") ||
    name.includes("pizza")
  );
}

function getInitialCartItems() {
  try {
    if (typeof window === "undefined") return [];

    const savedCart = localStorage.getItem(CART_STORAGE_KEY);
    if (!savedCart) return [];

    const parsedCart = JSON.parse(savedCart);
    return Array.isArray(parsedCart) ? parsedCart : [];
  } catch (error) {
    console.error("Erro ao carregar carrinho do localStorage:", error);
    return [];
  }
}

export default function Menu() {
  const location = useLocation();
  const navigate = useNavigate();
  const didPreselectRef = useRef(false);

  const [categories, setCategories] = useState([]);
  const [productsFromDb, setProductsFromDb] = useState([]);
  const [loading, setLoading] = useState(true);
  const [menuMessage, setMenuMessage] = useState("");

  const [activeCategory, setActiveCategory] = useState("all");
  const [search, setSearch] = useState("");
  const [cartItems, setCartItems] = useState(getInitialCartItems);
  const [cartOpen, setCartOpen] = useState(false);

  const [selectedProduct, setSelectedProduct] = useState(null);
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [notes, setNotes] = useState("");
  const [withoutOnion, setWithoutOnion] = useState(false);
  const [withoutTomato, setWithoutTomato] = useState(false);
  const [withoutOlive, setWithoutOlive] = useState(false);

  const loadMenuData = useCallback(async () => {
    setLoading(true);

    try {
      const [
        { data: categoriesData, error: categoriesError },
        { data: productsData, error: productsError },
      ] = await Promise.all([
        supabase
          .from("product_categories")
          .select("id, slug, name, is_active, sort_order, created_at")
          .eq("is_active", true)
          .order("sort_order", { ascending: true })
          .order("created_at", { ascending: true }),
        supabase
          .from("products")
          .select(`
            id,
            slug,
            name,
            description,
            price,
            old_price,
            rating,
            tag,
            image_url,
            is_active,
            is_featured,
            sort_order,
            created_at,
            category_id
          `)
          .eq("is_active", true)
          .order("sort_order", { ascending: true })
          .order("created_at", { ascending: true }),
      ]);

      if (categoriesError) throw categoriesError;
      if (productsError) throw productsError;

      const normalizedCategories = (categoriesData ?? []).map((category) => ({
        id: category.id,
        slug: category.slug,
        name: category.name,
      }));

      const categoriesById = Object.fromEntries(
        normalizedCategories.map((category) => [category.id, category])
      );

      const normalizedProducts = (productsData ?? []).map((product) => {
        const category = categoriesById[product.category_id];

        return {
          id: product.id,
          slug: product.slug,
          name: product.name,
          categoryId: product.category_id,
          categorySlug: category?.slug || "",
          categoryName: category?.name || "",
          description: product.description,
          price: Number(product.price || 0),
          oldPrice:
            product.old_price != null ? Number(product.old_price) : null,
          rating: product.rating != null ? Number(product.rating) : null,
          tag: product.tag || null,
          image: product.image_url || null,
          active: !!product.is_active,
          hero: !!product.is_featured,
          isCustomizable: isPizzaCategory(category),
        };
      });

      setCategories(normalizedCategories);
      setProductsFromDb(normalizedProducts);
      setMenuMessage("");
    } catch (error) {
      console.error("Erro ao carregar cardápio:", error);
      setCategories([]);
      setProductsFromDb([]);
      setMenuMessage("Não foi possível carregar o cardápio agora.");
    } finally {
      setLoading(false);
    }
  }, []);

  const baseProducts = useMemo(() => {
    return productsFromDb.filter((item) => item.active);
  }, [productsFromDb]);

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
        const categoryName = normalizeText(item.categoryName);

        return (
          name.includes(term) ||
          description.includes(term) ||
          tag.includes(term) ||
          categoryName.includes(term)
        );
      });
    }

    return filtered;
  }, [baseProducts, activeCategory, search]);

  const activeCategoryName = useMemo(() => {
    if (activeCategory === "all") return "Todas";

    return (
      categories.find((category) => category.id === activeCategory)?.name ||
      "Categoria"
    );
  }, [activeCategory, categories]);

  const cartCount = useMemo(
    () => cartItems.reduce((acc, item) => acc + Number(item.quantity || 0), 0),
    [cartItems]
  );

  const subtotal = useMemo(
    () =>
      cartItems.reduce(
        (acc, item) => acc + Number(item.price || 0) * Number(item.quantity || 0),
        0
      ),
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
    setSelectedProduct({
      ...product,
      isCustomizable: isCustomizableProduct(product),
    });
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

    const removedIngredients = isCustomizableProduct(selectedProduct)
      ? [
          withoutOnion ? "Sem cebola" : null,
          withoutTomato ? "Sem tomate" : null,
          withoutOlive ? "Sem azeitona" : null,
        ].filter(Boolean)
      : [];

    const trimmedNotes = notes.trim();

    setCartItems((prev) => [
      ...prev,
      {
        id: `${selectedProduct.id}-${Date.now()}`,
        productId: selectedProduct.id,
        name: selectedProduct.name,
        price: Number(selectedProduct.price || 0),
        image: selectedProduct.image || null,
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
            ? { ...item, quantity: Number(item.quantity || 0) - 1 }
            : item
        )
        .filter((item) => Number(item.quantity || 0) > 0)
    );
  }

  function handleIncrease(cartItemId) {
    setCartItems((prev) =>
      prev.map((item) =>
        item.id === cartItemId
          ? { ...item, quantity: Number(item.quantity || 0) + 1 }
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
    loadMenuData();

    const productsChannel = supabase
      .channel("menu-products")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "products",
        },
        () => {
          loadMenuData();
        }
      )
      .subscribe();

    const categoriesChannel = supabase
      .channel("menu-categories")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "product_categories",
        },
        () => {
          loadMenuData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(productsChannel);
      supabase.removeChannel(categoriesChannel);
    };
  }, [loadMenuData]);

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
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartItems));
    } catch (error) {
      console.error("Erro ao salvar carrinho no localStorage:", error);
    }
  }, [cartItems]);

  useEffect(() => {
    const openProductId = location.state?.openProductId;

    if (!openProductId) return;
    if (didPreselectRef.current) return;
    if (!productsFromDb.length) return;

    const selected = productsFromDb.find(
      (product) => product.id === openProductId || product.slug === openProductId
    );

    if (!selected) return;

    didPreselectRef.current = true;

    setActiveCategory("all");
    setSelectedProduct({
      ...selected,
      isCustomizable: isCustomizableProduct(selected),
    });
    resetProductOptions();
    setProductModalOpen(true);

    navigate(location.pathname, { replace: true, state: {} });
  }, [location.pathname, location.state, navigate, productsFromDb]);

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
              categories={categories}
              activeCategory={activeCategory}
              onChangeCategory={setActiveCategory}
            />

            <div className={styles.resultsBar}>
              <p className={styles.resultsText}>
                Mostrando <strong>{products.length}</strong>{" "}
                {products.length === 1 ? "produto" : "produtos"} • Categoria:{" "}
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
          {menuMessage ? (
            <div className={styles.emptyCatalog}>
              <div className={styles.emptyCatalogIcon}>⚠️</div>
              <h2>Não foi possível carregar o cardápio</h2>
              <p>{menuMessage}</p>

              <div className={styles.emptyCatalogActions}>
                <Button
                  type="button"
                  variant="ghost"
                  size="md"
                  onClick={loadMenuData}
                >
                  Tentar novamente
                </Button>
              </div>
            </div>
          ) : loading ? (
            <div className={styles.emptyCatalog}>
              <div className={styles.emptyCatalogIcon}>🍕</div>
              <h2>Carregando cardápio...</h2>
              <p>Aguarde enquanto buscamos os produtos.</p>
            </div>
          ) : products.length === 0 ? (
            <div className={styles.emptyCatalog}>
              <div className={styles.emptyCatalogIcon}>🍕</div>
              <h2>Nenhum produto encontrado</h2>
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