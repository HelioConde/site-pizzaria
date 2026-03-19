import { Link } from "react-router-dom";
import styles from "../Menu.module.css";
import Button from "../../../components/ui/Button/Button";

export default function CartDrawer({
  open,
  cartItems,
  cartCount,
  subtotal,
  deliveryFee,
  total,
  onClose,
  onDecrease,
  onIncrease,
  onRemove,
  formatPrice,
}) {
  return (
    <div
      className={`${styles.drawerOverlay} ${open ? styles.drawerOpen : ""}`}
      onClick={onClose}
      aria-hidden={!open}
    >
      <aside
        className={styles.drawer}
        onClick={(e) => e.stopPropagation()}
        aria-label="Carrinho de compras"
        role="dialog"
        aria-modal="true"
      >
        <div className={styles.drawerHead}>
          <div>
            <h2 className={styles.drawerTitle}>Seu carrinho</h2>
            <p className={styles.drawerSubtitle}>{cartCount} item(ns)</p>
          </div>

          <button
            type="button"
            className={styles.closeBtn}
            onClick={onClose}
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
                        <img src={item.image} alt={item.name} loading="lazy" />
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
                        onClick={() => onDecrease(item.id)}
                        aria-label={`Diminuir quantidade de ${item.name}`}
                      >
                        −
                      </button>

                      <span>{item.quantity}</span>

                      <button
                        type="button"
                        onClick={() => onIncrease(item.id)}
                        aria-label={`Aumentar quantidade de ${item.name}`}
                      >
                        +
                      </button>
                    </div>

                    <button
                      type="button"
                      className={styles.removeBtn}
                      onClick={() => onRemove(item.id)}
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

              <Button as={Link} to="/checkout" variant="primary" size="md">
                Finalizar pedido
              </Button>
            </div>
          </>
        )}
      </aside>
    </div>
  );
}