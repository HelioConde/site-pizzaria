import { Link } from "react-router-dom";
import styles from "./Highlights.module.css";

function formatPrice(value) {
  const numericValue = Number(value);

  if (!Number.isFinite(numericValue)) return null;

  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(numericValue);
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
    typeof badgeText === "string" && badgeText.trim() ? badgeText.trim() : "Top";

  const productTarget = item?.slug || item?.id || null;
  const safePrice = formatPrice(item?.price);
  const safeOldPrice = formatPrice(item?.oldPrice);

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
              src="./images/pizzaria-bg.png"
              alt=""
              className={styles.thumbBg}
              loading="lazy"
            />
          </div>

          {item?.image ? (
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

export default function Highlights({ data, products = [] }) {
  if (!data || typeof data !== "object") return null;

  const title =
    typeof data.title === "string" && data.title.trim()
      ? data.title.trim()
      : "Destaques";

  const subtitle =
    typeof data.subtitle === "string" && data.subtitle.trim()
      ? data.subtitle.trim()
      : "";

  const safeProducts = Array.isArray(products) ? products.filter(Boolean) : [];

  const productsByKey = Object.fromEntries(
    safeProducts.flatMap((product) => {
      const entries = [];

      if (product?.id) {
        entries.push([product.id, product]);
      }

      if (product?.slug) {
        entries.push([product.slug, product]);
      }

      return entries;
    })
  );

  const groups = (Array.isArray(data.groups) ? data.groups : []).map(
    (group, groupIndex) => ({
      id: group?.id ?? `highlight-group-${groupIndex}`,
      title:
        typeof group?.title === "string" && group.title.trim()
          ? group.title.trim()
          : `Grupo ${groupIndex + 1}`,
      badge:
        typeof group?.badge === "string" && group.badge.trim()
          ? group.badge.trim()
          : "Top",
      resolvedItems: (Array.isArray(group?.items) ? group.items : [])
        .map((itemKey) => productsByKey[itemKey])
        .filter(Boolean),
    })
  );

  const visibleGroups = groups.filter((group) => group.resolvedItems.length > 0);

  if (!visibleGroups.length) return null;

  return (
    <section className={styles.wrap} aria-label={title}>
      <div className={styles.container}>
        <header className={styles.head}>
          <h2 className={styles.title}>{title}</h2>
          {subtitle ? <p className={styles.subtitle}>{subtitle}</p> : null}
        </header>

        <div className={styles.grid}>
          {visibleGroups.map((group, index) => (
            <div className={styles.panel} key={group.id}>
              <div className={styles.panelHead}>
                <span className={styles.panelIcon} aria-hidden="true">
                  {index === 0 ? "🍕" : "🔥"}
                </span>
                <h3 className={styles.panelTitle}>{group.title}</h3>
              </div>

              <div className={styles.list}>
                {group.resolvedItems.map((item, itemIndex) => (
                  <ItemCard
                    key={item?.id ?? item?.slug ?? `${group.id}-item-${itemIndex}`}
                    item={item}
                    badgeText={group.badge}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}