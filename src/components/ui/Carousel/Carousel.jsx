import { useEffect, useMemo, useRef, useState } from "react";
import styles from "./Carousel.module.css";
import Button from "../Button/Button";

const defaultSlides = [
  {
    id: 1,
    badge: "Plataforma digital para pizzarias modernas",
    titleParts: ["Delivery inteligente com ", "rastreamento em tempo real", "."],
    description:
      "Peça sua pizza, acompanhe o preparo e veja a entrega chegando até você. Experiência clean, rápida e confiável.",
    primaryCta: { label: "Fazer pedido", href: "#fazer-pedido" },
    secondaryCta: { label: "Ver como funciona", href: "#como-funciona" },
    footnote: "*Projeto de portfólio com foco em UX e arquitetura escalável.",
  },
  {
    id: 2,
    badge: "Cardápio inteligente e rápido",
    titleParts: ["Escolha sabores, ", "monte combos", " e finalize em segundos."],
    description:
      "Um cardápio bonito, com filtros e categorias. Menos cliques, mais pedidos.",
    primaryCta: { label: "Ver cardápio", href: "#cardapio" },
    secondaryCta: { label: "Como funciona", href: "#como-funciona" },
    footnote: "*Interface pensada para conversão e velocidade.",
  },
  {
    id: 3,
    badge: "Painel de pedidos (Admin)",
    titleParts: ["Controle total: ", "pagamento, preparo", " e entrega."],
    description:
      "Acompanhe status em tempo real e reduza erros no atendimento com um fluxo simples.",
    primaryCta: { label: "Abrir painel", href: "#admin" },
    secondaryCta: { label: "Ver demo", href: "#como-funciona" },
    footnote: "*Arquitetura preparada para crescer.",
  },
];

export default function Carousel({
  slides = defaultSlides,
  autoPlay = true,
  interval = 60500,
  ariaLabel = "Destaques",
}) {
  const safeSlides = useMemo(() => slides.filter(Boolean), [slides]);
  const [index, setIndex] = useState(0);
  const timerRef = useRef(null);
  const startX = useRef(null);

  const max = safeSlides.length;

  const goTo = (i) => {
    if (!max) return;
    setIndex((i + max) % max);
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
    const threshold = 42;

    if (diff > threshold) prev();
    if (diff < -threshold) next();

    startX.current = null;
  };

  if (max === 0) return null;

  return (
    <section className={styles.wrap} aria-label={ariaLabel} id="inicio">
      {/* CLIP full-width pra impedir vazamento do próximo slide */}
      <div className={styles.clip}>
        <div
          className={styles.viewport}
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
        >
          <div
            className={styles.track}
            style={{ transform: `translateX(-${index * 100}%)` }}
          >
            {safeSlides.map((s, i) => (
              <article className={styles.slide} key={s.id ?? i}>
                <div className={styles.grid}>
                  <div className={styles.left}>
                    <div className={styles.badge}>
                      <span className={styles.badgeIcon} aria-hidden="true">
                        ✦
                      </span>
                      {s.badge}
                    </div>

                    <h1 className={styles.title}>
                      {s.titleParts?.[0]}
                      <span className={styles.accent}>{s.titleParts?.[1]}</span>
                      {s.titleParts?.[2]}
                    </h1>

                    <p className={styles.desc}>{s.description}</p>

                    <div className={styles.ctaRow}>
                      <Button as="a" href={s.primaryCta?.href} variant="primary" size="md">
                        {s.primaryCta?.label} <span aria-hidden="true">→</span>
                      </Button>

                      <Button as="a" href={s.secondaryCta?.href} variant="ghost" size="md">
                        {s.secondaryCta?.label}
                      </Button>
                    </div>

                    <p className={styles.footnote}>{s.footnote}</p>
                  </div>

                  <div className={styles.right}>
                    <MockCard />
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>

      <div className={styles.controls}>
        <button className={styles.navBtn} type="button" onClick={prev} aria-label="Anterior">
          ‹
        </button>

        <div className={styles.dots} role="tablist" aria-label="Selecionar slide">
          {safeSlides.map((_, i) => (
            <button
              key={i}
              type="button"
              className={`${styles.dot} ${i === index ? styles.dotActive : ""}`}
              onClick={() => goTo(i)}
              aria-label={`Ir para o slide ${i + 1}`}
              aria-current={i === index ? "true" : "false"}
            />
          ))}
        </div>

        <button className={styles.navBtn} type="button" onClick={next} aria-label="Próximo">
          ›
        </button>
      </div>
    </section>
  );
}

function MockCard() {
  return (
    <div className={styles.mock}>
      <div className={styles.mockTop}>
        <span className={styles.dotWin} />
        <span className={styles.dotWin} />
        <span className={styles.dotWin} />
      </div>

      <div className={styles.mockLine} />
      <div className={styles.mockLineShort} />

      <div className={styles.mockRow}>
        <div className={styles.mockPill} />
        <div className={styles.mockPill} />
        <div className={styles.mockPill} />
      </div>

      <div className={styles.mockBig} />
    </div>
  );
}