import { useEffect, useMemo, useState } from "react";
import db from "../../data/db.json";
import styles from "./Menu.module.css";
import Button from "../../components/ui/Button/Button";
import Navbar from "../../components/layout/NavBar";
import { Link } from "react-router-dom";

function formatPrice(value) {
    if (value == null) return null;

    return new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
    }).format(value);
}

function ProductCard({ item, onAdd }) {
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
                        onClick={() => onAdd(item)}
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

    const [activeCategory, setActiveCategory] = useState("all");
    const [cartItems, setCartItems] = useState([]);
    const [cartOpen, setCartOpen] = useState(false);

    const products = useMemo(() => {
        const base = (cardapio?.pizzas ?? []).filter((item) => item.active);

        if (activeCategory === "all") return base;

        return base.filter((item) => item.categoryId === activeCategory);
    }, [cardapio, activeCategory]);

    function handleAdd(product) {
        setCartItems((prev) => {
            const existing = prev.find((item) => item.id === product.id);

            if (existing) {
                return prev.map((item) =>
                    item.id === product.id
                        ? { ...item, quantity: item.quantity + 1 }
                        : item
                );
            }

            return [
                ...prev,
                {
                    id: product.id,
                    name: product.name,
                    price: product.price,
                    image: product.image,
                    quantity: 1,
                },
            ];
        });

        setCartOpen(true);
    }

    function handleDecrease(productId) {
        setCartItems((prev) =>
            prev
                .map((item) =>
                    item.id === productId
                        ? { ...item, quantity: item.quantity - 1 }
                        : item
                )
                .filter((item) => item.quantity > 0)
        );
    }

    function handleIncrease(productId) {
        setCartItems((prev) =>
            prev.map((item) =>
                item.id === productId
                    ? { ...item, quantity: item.quantity + 1 }
                    : item
            )
        );
    }

    function handleRemove(productId) {
        setCartItems((prev) => prev.filter((item) => item.id !== productId));
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
        document.body.style.overflow = cartOpen ? "hidden" : "";
        return () => {
            document.body.style.overflow = "";
        };
    }, [cartOpen]);

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
                            <ProductCard key={item.id} item={item} onAdd={handleAdd} />
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
