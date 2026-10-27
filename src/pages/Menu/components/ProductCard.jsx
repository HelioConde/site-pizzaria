import styles from "../Menu.module.css";
import Button from "../../../components/ui/Button/Button";
import { hasRealDiscount } from "../../../lib/merchandising.js";

export default function ProductCard({ item, onOpenModal, formatPrice }) {
  const discounted = hasRealDiscount(item.oldPrice, item.price);
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
            {discounted ? (
              <span className={styles.oldPrice}>
                {formatPrice(item.oldPrice)}
              </span>
            ) : null}

            <span className={styles.price}>{formatPrice(item.price)}</span>
          </div>

          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={() => onOpenModal(item)}
            aria-label={`Personalizar e adicionar ${item.name} ao carrinho`}
          >
            Adicionar
          </Button>
        </div>
      </div>
    </article>
  );
}