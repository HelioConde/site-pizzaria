import styles from "./Highlights.module.css";

function formatPrice(value) {
  if (value == null) return null;

  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

function Rating({ value }) {
  return (
    <div className={styles.rating} aria-label={`Nota ${value}`}>
      <span className={styles.star} aria-hidden="true">☆</span>
      <span className={styles.ratingValue}>{value}</span>
    </div>
  );
}

function ItemCard({ item, badgeText }) {
  return (
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

        {item.image ? (
          <img
            src={item.image}
            alt={item.name}
            className={styles.thumbPizza}
            loading="lazy"
          />
        ) : (
          <span className={styles.thumbFallback}>🍕</span>
        )}
      </div>

      <div className={styles.itemMain}>
        <div className={styles.itemTop}>
          <h4 className={styles.itemTitle}>{item.name}</h4>
          <span className={styles.pill}>{badgeText}</span>
        </div>

        <p className={styles.itemDesc}>{item.description}</p>

        <div className={styles.itemBottom}>
          <div className={styles.priceRow}>
            {item.oldPrice ? (
              <span className={styles.oldPrice}>{formatPrice(item.oldPrice)}</span>
            ) : null}
            <span className={styles.price}>{formatPrice(item.price)}</span>
          </div>
          <Rating value={item.rating} />
        </div>
      </div>
    </article>
  );
}

export default function Highlights({ data, pizzas = [] }) {
  if (!data) return null;

  console.log(pizzas)

  const pizzasById = Object.fromEntries(
    pizzas.map((pizza) => [pizza.id, pizza])
  );



  const groups = (data.groups ?? []).map((group) => ({
    ...group,
    resolvedItems: (group.items ?? [])
      .map((itemId) => pizzasById[itemId])
      .filter(Boolean),
  }));

  return (
    <section className={styles.wrap} aria-label={data.title}>
      <div className={styles.container}>
        <header className={styles.head}>
          <h2 className={styles.title}>{data.title}</h2>
          <p className={styles.subtitle}>{data.subtitle}</p>
        </header>

        <div className={styles.grid}>
          {groups.map((group, index) => (
            <div className={styles.panel} key={group.id}>
              <div className={styles.panelHead}>
                <span className={styles.panelIcon} aria-hidden="true">
                  {index === 0 ? "🍕" : "🔥"}
                </span>
                <h3 className={styles.panelTitle}>{group.title}</h3>
              </div>

              <div className={styles.list}>
                {group.resolvedItems.map((item) => (
                  <ItemCard
                    key={item.id}
                    item={item}
                    badgeText={group.badge ?? "Top"}
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