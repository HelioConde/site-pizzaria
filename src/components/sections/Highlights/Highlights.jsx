import { Link } from "react-router-dom";
import styles from "./Highlights.module.css";

const backgroundImageSrc = `${import.meta.env.BASE_URL}images/pizzaria-bg.png`;

function formatPrice(value) {
  if (value == null || value === "") return null;

  const numericValue = Number(value);

  if (!Number.isFinite(numericValue)) return null;
  if (numericValue < 0) return null;

  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(numericValue);
}

function hasValidOldPrice(value) {
  if (value == null || value === "") return false;

  const numericValue = Number(value);

  return Number.isFinite(numericValue) && numericValue > 0;
}

function normalizeRating(value) {
  const numericValue = Number(value);

  if (!Number.isFinite(numericValue)) return null;
  if (numericValue < 0) return 0;
  if (numericValue > 5) return 5;

  return Math.round(numericValue * 10) / 10;
}

function Rating({ value }) {
  const safeValue = normalizeRating(value);

  if (safeValue == null) {
    return (
      <div className={styles.rating} aria-label="Sem avaliação">
        <span className={styles.star} aria-hidden="true">
          ☆
        </span>
        <span className={styles.ratingValue}>--</span>
      </div>
    );
  }

  return (
    <div
      className={styles.rating}
      aria-label={`Nota ${safeValue} de 5 estrelas`}
      title={`Nota ${safeValue} de 5 estrelas`}
    >
      <span className={styles.star} aria-hidden="true">
        ★
      </span>
      <span className={styles.ratingValue}>{safeValue}</span>
    </div>
  );
}

function ItemCard({ item, badgeText }) {
  const safeName =
    typeof item?.name === "string" && item.name.trim()
      ? item.name.trim()
      : "Produto";

  const safeDescription =
    typeof item?.description === "string" && item.description.trim()
      ? item.description.trim()
      : "Descrição indisponível no momento.";

  const safeBadge =
    typeof badgeText === "string" && badgeText.trim()
      ? badgeText.trim()
      : "Top";

  const productTarget = item?.slug || item?.id || null;
  const safePrice = formatPrice(item?.price);
  const safeOldPrice = hasValidOldPrice(item?.oldPrice)
    ? formatPrice(item?.oldPrice)
    : null;

  return (
    <Link
      to="/menu"
      state={productTarget ? { openProductId: productTarget } : undefined}
      className={styles.itemLink}
      aria-label={`Abrir ${safeName} para personalizar`}
    >
      <article className={styles.item}>
        <div className={styles.thumb} aria-hidden="true">
          <div className={styles.thumbFrame}>
            <img
              src={backgroundImageSrc}
              alt=""
              className={styles.thumbBg}
              loading="lazy"
            />
          </div>

          {typeof item?.image === "string" && item.image.trim() ? (
            <img
              src={item.image}
              alt={safeName}
              className={styles.thumbPizza}
              loading="lazy"
            />
          ) : (
            <span className={styles.thumbFallback}>🍕</span>
          )}
        </div>

        <div className={styles.itemMain}>
          <div className={styles.itemTop}>
            <h4 className={styles.itemTitle} title={safeName}>
              {safeName}
            </h4>
            <span className={styles.pill}>{safeBadge}</span>
          </div>

          <p className={styles.itemDesc}>{safeDescription}</p>

          <div className={styles.itemBottom}>
            <div className={styles.priceRow}>
              {safeOldPrice ? (
                <span className={styles.oldPrice}>{safeOldPrice}</span>
              ) : null}

              <span className={styles.price}>
                {safePrice || "Preço indisponível"}
              </span>
            </div>

            <Rating value={item?.rating} />
          </div>
        </div>
      </article>
    </Link>
  );
}

export default function Highlights({ products = [] }) {
  const safeProducts = Array.isArray(products) ? products.filter(Boolean) : [];

  const activeProducts = safeProducts.filter((product) => product?.active);

  const bestSellers = [...activeProducts]
    .sort((a, b) => Number(a?.sortOrder || 0) - Number(b?.sortOrder || 0))
    .slice(0, 2);

  const promotions = activeProducts
    .filter((product) => hasValidOldPrice(product?.oldPrice))
    .slice(0, 2);

  if (!bestSellers.length && !promotions.length) {
    return null;
  }

  return (
    <section className={styles.wrap} aria-label="Destaques">
      <div className={styles.container}>
        <header className={styles.head}>
          <h2 className={styles.title}>Destaques</h2>
          <p className={styles.subtitle}>
            Os sabores mais pedidos e as melhores promoções do momento.
          </p>
        </header>

        <div className={styles.grid}>
          {bestSellers.length > 0 ? (
            <div className={styles.panel}>
              <div className={styles.panelHead}>
                <span className={styles.panelIcon} aria-hidden="true">
                  🍕
                </span>
                <h3 className={styles.panelTitle}>Mais vendidos</h3>
              </div>

              <div className={styles.list}>
                {bestSellers.map((item, index) => (
                  <ItemCard
                    key={item?.id ?? item?.slug ?? `best-seller-${index}`}
                    item={item}
                    badgeText="Top"
                  />
                ))}
              </div>
            </div>
          ) : null}

          {promotions.length > 0 ? (
            <div className={styles.panel}>
              <div className={styles.panelHead}>
                <span className={styles.panelIcon} aria-hidden="true">
                  🔥
                </span>
                <h3 className={styles.panelTitle}>Promoções</h3>
              </div>

              <div className={styles.list}>
                {promotions.map((item, index) => (
                  <ItemCard
                    key={item?.id ?? item?.slug ?? `promotion-${index}`}
                    item={item}
                    badgeText="Promo"
                  />
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}