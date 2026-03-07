import { useEffect, useMemo, useRef, useState } from "react";
import db from "../../data/db.json";
import styles from "./Menu.module.css";
import Button from "../../components/ui/Button/Button";
import { Link, useLocation } from "react-router-dom";

function formatPrice(value) {
    if (value == null) return null;

    return new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
    }).format(value);
}

function ProductCard({ item, onOpenModal }) {
    return (
        <article className={styles.card}>
            <div className={styles.imageWrap}>
                {item.image ? (
                    <img
                        src={item.image}
                        alt={item.name}
                        className={styles.image}
                        loading="lazy"
                    />
                ) : (
                    <div className={styles.imageFallback}>🍕</div>
                )}

                {item.tag ? <span className={styles.badge}>{item.tag}</span> : null}
            </div>

            <div className={styles.cardBody}>
                <h3 className={styles.cardTitle}>{item.name}</h3>
                <p className={styles.cardDesc}>{item.description}</p>

                <div className={styles.cardFooter}>
                    <div className={styles.priceBox}>
                        {item.oldPrice ? (
                            <span className={styles.oldPrice}>{formatPrice(item.oldPrice)}</span>
                        ) : null}
                        <span className={styles.price}>{formatPrice(item.price)}</span>
                    </div>

                    <Button
                        type="button"
                        variant="primary"
                        size="sm"
                        onClick={() => onOpenModal(item)}
                    >
                        Adicionar
                    </Button>
                </div>
            </div>
        </article>
    );
}

export default function Menu() {
    const { cardapio } = db;
    const location = useLocation();
    const didPreselectRef = useRef(false);

    const [activeCategory, setActiveCategory] = useState("all");
    const [cartItems, setCartItems] = useState([]);
    const [cartOpen, setCartOpen] = useState(false);

    const [selectedProduct, setSelectedProduct] = useState(null);
    const [productModalOpen, setProductModalOpen] = useState(false);
    const [notes, setNotes] = useState("");
    const [withoutOnion, setWithoutOnion] = useState(false);
    const [withoutTomato, setWithoutTomato] = useState(false);
    const [withoutOlive, setWithoutOlive] = useState(false);

    const products = useMemo(() => {
        const base = (cardapio?.pizzas ?? []).filter((item) => item.active);

        if (activeCategory === "all") return base;

        return base.filter((item) => item.categoryId === activeCategory);
    }, [cardapio, activeCategory]);

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

    useEffect(() => {
        document.body.style.overflow = cartOpen || productModalOpen ? "hidden" : "";
        return () => {
            document.body.style.overflow = "";
        };
    }, [cartOpen, productModalOpen]);

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
                <section className={styles.heroButton}>
                    <div className={styles.heroContent}>
                        <Link to="/" className={styles.backBtn}>
                            ← Voltar
                        </Link>
                    </div>
                </section>

                <section className={styles.hero}>
                    <div className={styles.heroContent}>
                        <span className={styles.kicker}>Cardápio digital</span>
                        <h1 className={styles.title}>Nosso cardápio</h1>
                        <p className={styles.subtitle}>
                            Escolha sua pizza favorita, filtre por categoria e monte seu pedido
                            com rapidez.
                        </p>
                    </div>
                </section>

                <section className={styles.filtersSection}>
                    <div className={styles.filters}>
                        <button
                            type="button"
                            className={`${styles.filterBtn} ${activeCategory === "all" ? styles.filterActive : ""
                                }`}
                            onClick={() => setActiveCategory("all")}
                        >
                            Todas
                        </button>

                        {(cardapio?.categories ?? []).map((category) => (
                            <button
                                key={category.id}
                                type="button"
                                className={`${styles.filterBtn} ${activeCategory === category.id ? styles.filterActive : ""
                                    }`}
                                onClick={() => setActiveCategory(category.id)}
                            >
                                {category.name}
                            </button>
                        ))}
                    </div>
                </section>

                <section className={styles.catalogSection}>
                    <div className={styles.grid}>
                        {products.map((item) => (
                            <ProductCard
                                key={item.id}
                                item={item}
                                onOpenModal={handleOpenProductModal}
                            />
                        ))}
                    </div>
                </section>
            </main>

            <button
                type="button"
                className={styles.floatingCart}
                onClick={() => setCartOpen(true)}
                aria-label={`Abrir carrinho com ${cartCount} item(ns)`}
            >
                <span className={styles.floatingCartIcon} aria-hidden="true">
                    🛒
                </span>
                <span className={styles.floatingCartCount}>{cartCount}</span>
            </button>

            {productModalOpen && selectedProduct && (
                <div
                    className={styles.productModalOverlay}
                    onClick={handleCloseProductModal}
                    aria-hidden={!productModalOpen}
                >
                    <div
                        className={styles.productModal}
                        onClick={(e) => e.stopPropagation()}
                        aria-label="Personalizar produto"
                    >
                        <div className={styles.productModalHead}>
                            <div>
                                <h2 className={styles.productModalTitle}>{selectedProduct.name}</h2>
                                <p className={styles.productModalPrice}>
                                    {formatPrice(selectedProduct.price)}
                                </p>
                            </div>

                            <button
                                type="button"
                                className={styles.closeBtn}
                                onClick={handleCloseProductModal}
                                aria-label="Fechar personalização"
                            >
                                ✕
                            </button>
                        </div>

                        <p className={styles.productModalDesc}>
                            {selectedProduct.description}
                        </p>

                        <div className={styles.productOptions}>
                            <h3 className={styles.optionTitle}>Remover ingredientes</h3>

                            <label className={styles.optionItem}>
                                <input
                                    type="checkbox"
                                    checked={withoutOnion}
                                    onChange={(e) => setWithoutOnion(e.target.checked)}
                                />
                                <span>Sem cebola</span>
                            </label>

                            <label className={styles.optionItem}>
                                <input
                                    type="checkbox"
                                    checked={withoutTomato}
                                    onChange={(e) => setWithoutTomato(e.target.checked)}
                                />
                                <span>Sem tomate</span>
                            </label>

                            <label className={styles.optionItem}>
                                <input
                                    type="checkbox"
                                    checked={withoutOlive}
                                    onChange={(e) => setWithoutOlive(e.target.checked)}
                                />
                                <span>Sem azeitona</span>
                            </label>
                        </div>

                        <div className={styles.notesWrap}>
                            <label htmlFor="product-notes" className={styles.optionTitle}>
                                Observações
                            </label>

                            <textarea
                                id="product-notes"
                                className={styles.notesField}
                                placeholder="Ex: massa bem assada, sem muito molho..."
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                            />
                        </div>

                        <div className={styles.productModalActions}>
                            <Button
                                type="button"
                                variant="ghost"
                                size="md"
                                onClick={handleCloseProductModal}
                            >
                                Cancelar
                            </Button>

                            <Button
                                type="button"
                                variant="primary"
                                size="md"
                                onClick={handleConfirmProduct}
                            >
                                Adicionar ao carrinho
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            <div
                className={`${styles.drawerOverlay} ${cartOpen ? styles.drawerOpen : ""}`}
                onClick={() => setCartOpen(false)}
                aria-hidden={!cartOpen}
            >
                <aside
                    className={styles.drawer}
                    onClick={(e) => e.stopPropagation()}
                    aria-label="Carrinho de compras"
                >
                    <div className={styles.drawerHead}>
                        <div>
                            <h2 className={styles.drawerTitle}>Seu carrinho</h2>
                            <p className={styles.drawerSubtitle}>{cartCount} item(ns)</p>
                        </div>

                        <button
                            type="button"
                            className={styles.closeBtn}
                            onClick={() => setCartOpen(false)}
                            aria-label="Fechar carrinho"
                        >
                            ✕
                        </button>
                    </div>

                    {cartItems.length === 0 ? (
                        <div className={styles.emptyCart}>
                            <p>Nenhum item adicionado ainda.</p>
                            <span>Escolha uma pizza para começar seu pedido.</span>
                        </div>
                    ) : (
                        <>
                            <div className={styles.cartList}>
                                {cartItems.map((item) => (
                                    <div key={item.id} className={styles.cartItem}>
                                        <div className={styles.cartItemInfo}>
                                            <div className={styles.cartThumb}>
                                                {item.image ? (
                                                    <img
                                                        src={item.image}
                                                        alt={item.name}
                                                        loading="lazy"
                                                    />
                                                ) : (
                                                    "🍕"
                                                )}
                                            </div>

                                            <div className={styles.cartMeta}>
                                                <h3 className={styles.cartItemName}>{item.name}</h3>
                                                <p className={styles.cartItemPrice}>
                                                    {formatPrice(item.price)}
                                                </p>

                                                {item.removedIngredients?.length > 0 ? (
                                                    <p className={styles.cartItemNotes}>
                                                        {item.removedIngredients.join(" • ")}
                                                    </p>
                                                ) : null}

                                                {item.notes ? (
                                                    <p className={styles.cartItemNotes}>{item.notes}</p>
                                                ) : null}
                                            </div>
                                        </div>

                                        <div className={styles.cartActions}>
                                            <div className={styles.qtyBox}>
                                                <button
                                                    type="button"
                                                    onClick={() => handleDecrease(item.id)}
                                                    aria-label={`Diminuir quantidade de ${item.name}`}
                                                >
                                                    −
                                                </button>

                                                <span>{item.quantity}</span>

                                                <button
                                                    type="button"
                                                    onClick={() => handleIncrease(item.id)}
                                                    aria-label={`Aumentar quantidade de ${item.name}`}
                                                >
                                                    +
                                                </button>
                                            </div>

                                            <button
                                                type="button"
                                                className={styles.removeBtn}
                                                onClick={() => handleRemove(item.id)}
                                            >
                                                Remover
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className={styles.summary}>
                                <div className={styles.summaryRow}>
                                    <span>Subtotal</span>
                                    <strong>{formatPrice(subtotal)}</strong>
                                </div>

                                <div className={styles.summaryRow}>
                                    <span>Entrega</span>
                                    <strong>{formatPrice(deliveryFee)}</strong>
                                </div>

                                <div className={`${styles.summaryRow} ${styles.summaryTotal}`}>
                                    <span>Total</span>
                                    <strong>{formatPrice(total)}</strong>
                                </div>

                                <Button type="button" variant="primary" size="md">
                                    Finalizar pedido
                                </Button>
                            </div>
                        </>
                    )}
                </aside>
            </div>
        </>
    );
}