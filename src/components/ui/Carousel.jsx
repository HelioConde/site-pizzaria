import { useEffect, useMemo, useRef, useState } from "react";
import styles from "./Carousel.module.css"

const promo = [
  {
    id: 1,
    title: "Pepperoni Supreme",
    description: "Molho artesanal, pepperoni e muito queijo. Perfeita pra dividir.",
    price: "R$ 39,90",
    image: "", // depois colocamos imagem
  },
  {
    id: 2,
    title: "Frango com Catupiry",
    description: "Clássica e cremosa. Uma das mais pedidas da casa.",
    price: "R$ 42,90",
    image: "",
  },
  {
    id: 3,
    title: "4 Queijos Premium",
    description: "Muçarela, gorgonzola, parmesão e provolone.",
    price: "R$ 44,90",
    image: "",
  },
];

export default function Carousel({
  items = [],
  autoPlay = true,
  interval = 4500,
  ariaLabel = "Carrossel",
}) {
  const safeItems = useMemo(() => items.filter(Boolean), [items]);
  const [index, setIndex] = useState(0);
  const timerRef = useRef(null);
  const startX = useRef(null);

  const max = safeItems.length;

  const goTo = (i) => {
    if (!max) return;
    const next = (i + max) % max;
    setIndex(next);
  };

  const next = () => goTo(index + 1);
  const prev = () => goTo(index - 1);

  useEffect(() => {
    if (!autoPlay || max <= 1) return;
    timerRef.current = setInterval(() => {
      setIndex((v) => (v + 1) % max);
    }, interval);

    return () => clearInterval(timerRef.current);
  }, [autoPlay, interval, max]);

  const onTouchStart = (e) => {
    startX.current = e.touches?.[0]?.clientX ?? null;
  };

  const onTouchEnd = (e) => {
    if (startX.current == null) return;
    const endX = e.changedTouches?.[0]?.clientX ?? null;
    if (endX == null) return;

    const diff = endX - startX.current;
    const threshold = 42; // sensibilidade do swipe

    if (diff > threshold) prev();
    if (diff < -threshold) next();

    startX.current = null;
  };

  if (max === 0) return null;

  return (
    <section className="carousel" aria-label={ariaLabel}>
      <div
        className="carousel__viewport"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        <div
          className="carousel__track"
          style={{ transform: `translateX(-${index * 100}%)` }}
        >
          {safeItems.map((item, i) => (
            <article className="carousel__slide" key={item.id ?? i}>
              <div className="carousel__card">
                <div className="carousel__badge">Destaque</div>

                <div className="carousel__content">
                  <h3 className="carousel__title">{item.title}</h3>
                  <p className="carousel__desc">{item.description}</p>

                  <div className="carousel__row">
                    <div className="carousel__price">
                      <span className="carousel__priceFrom">a partir de</span>
                      <span className="carousel__priceValue">{item.price}</span>
                    </div>

                    <a className="btn btn--primary" href="#fazer-pedido">
                      Pedir agora
                    </a>
                  </div>
                </div>

                {item.image ? (
                  <img
                    className="carousel__img"
                    src={item.image}
                    alt={item.title}
                    loading="lazy"
                  />
                ) : (
                  <div className="carousel__imgPlaceholder" aria-hidden="true">
                    🍕
                  </div>
                )}
              </div>
            </article>
          ))}
        </div>
      </div>

      <div className="carousel__controls">
        <button className="carousel__btn" type="button" onClick={prev} aria-label="Anterior">
          ‹
        </button>

        <div className="carousel__dots" role="tablist" aria-label="Selecionar slide">
          {safeItems.map((_, i) => (
            <button
              key={i}
              className={`carousel__dot ${i === index ? "is-active" : ""}`}
              type="button"
              onClick={() => goTo(i)}
              aria-label={`Ir para o slide ${i + 1}`}
              aria-current={i === index ? "true" : "false"}
            />
          ))}
        </div>

        <button className="carousel__btn" type="button" onClick={next} aria-label="Próximo">
          ›
        </button>
      </div>
    </section>
  );
}