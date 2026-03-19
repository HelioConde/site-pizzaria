import { useEffect, useId, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import styles from "./Carousel.module.css";
import Button from "../Button/Button";

export default function Carousel({
  slides,
  autoPlay = true,
  interval = 6500,
  ariaLabel = "Destaques",
}) {
  const safeSlides = useMemo(() => {
    return Array.isArray(slides) ? slides.filter(Boolean) : [];
  }, [slides]);

  const [index, setIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const timerRef = useRef(null);
  const startX = useRef(null);
  const carouselId = useId();

  const max = safeSlides.length;
  const safeInterval = Number(interval) > 0 ? Number(interval) : 6500;

  function clearTimer() {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }

  function goTo(nextIndex) {
    if (!max) return;

    setIndex(((nextIndex % max) + max) % max);
  }

  function next() {
    setIndex((current) => {
      if (!max) return 0;
      return (current + 1) % max;
    });
  }

  function prev() {
    setIndex((current) => {
      if (!max) return 0;
      return (current - 1 + max) % max;
    });
  }

  useEffect(() => {
    if (index >= max && max > 0) {
      setIndex(0);
    }

    if (max === 0 && index !== 0) {
      setIndex(0);
    }
  }, [max, index]);

  useEffect(() => {
    if (!autoPlay || isPaused || max <= 1) {
      clearTimer();
      return;
    }

    timerRef.current = setInterval(() => {
      setIndex((current) => (current + 1) % max);
    }, safeInterval);

    return () => {
      clearTimer();
    };
  }, [autoPlay, isPaused, max, safeInterval]);

  useEffect(() => {
    function handleVisibilityChange() {
      if (document.hidden) {
        setIsPaused(true);
      } else {
        setIsPaused(false);
      }
    }

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  function onTouchStart(event) {
    startX.current = event.touches?.[0]?.clientX ?? null;
  }

  function onTouchEnd(event) {
    if (startX.current == null) return;

    const endX = event.changedTouches?.[0]?.clientX ?? null;

    if (endX == null) {
      startX.current = null;
      return;
    }

    const diff = endX - startX.current;
    const threshold = 42;

    if (diff > threshold) {
      prev();
    } else if (diff < -threshold) {
      next();
    }

    startX.current = null;
  }

  function onKeyDown(event) {
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      prev();
    }

    if (event.key === "ArrowRight") {
      event.preventDefault();
      next();
    }
  }

  if (max === 0) return null;

  return (
    <section
      className={styles.wrap}
      aria-label={ariaLabel}
      aria-roledescription="carousel"
      id="inicio"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onFocusCapture={() => setIsPaused(true)}
      onBlurCapture={() => setIsPaused(false)}
    >
      <div
        className={styles.viewport}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        onKeyDown={onKeyDown}
        tabIndex={0}
      >
        <div
          className={styles.track}
          style={{ transform: `translateX(-${index * 100}%)` }}
        >
          {safeSlides.map((slide, slideIndex) => {
            const isActive = slideIndex === index;
            const titleParts = Array.isArray(slide.titleParts)
              ? slide.titleParts
              : [slide.title || "", "", ""];

            const primaryHref = slide?.primaryCta?.href || "/menu";
            const primaryLabel = slide?.primaryCta?.label || "Fazer pedido";
            const secondaryHref = slide?.secondaryCta?.href || "#destaques";
            const secondaryLabel = slide?.secondaryCta?.label || "Saiba mais";

            return (
              <article
                className={styles.slide}
                key={slide.id ?? `${carouselId}-${slideIndex}`}
                id={`${carouselId}-slide-${slideIndex}`}
                role="group"
                aria-roledescription="slide"
                aria-label={`Slide ${slideIndex + 1} de ${max}`}
                aria-hidden={!isActive}
              >
                <div className={styles.grid}>
                  <div className={styles.left}>
                    {slide?.badge ? (
                      <div className={styles.badge}>
                        <span className={styles.badgeIcon} aria-hidden="true">
                          ✦
                        </span>
                        {slide.badge}
                      </div>
                    ) : null}

                    <h1 className={styles.title}>
                      {titleParts?.[0] || ""}
                      <span className={styles.accent}>
                        {titleParts?.[1] || ""}
                      </span>
                      {titleParts?.[2] || ""}
                    </h1>

                    {slide?.description ? (
                      <p className={styles.desc}>{slide.description}</p>
                    ) : null}

                    <div className={styles.ctaRow}>
                      <Button
                        as={Link}
                        to={primaryHref}
                        variant="primary"
                        size="md"
                      >
                        {primaryLabel} <span aria-hidden="true">→</span>
                      </Button>

                      <Button as="a" href={secondaryHref} variant="ghost">
                        {secondaryLabel}
                      </Button>
                    </div>

                    {slide?.footnote ? (
                      <p className={styles.footnote}>{slide.footnote}</p>
                    ) : null}
                  </div>

                  <div className={styles.right}>
                    <MockCard />
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </div>

      <div className={styles.controls}>
        <button
          className={styles.navBtn}
          type="button"
          onClick={prev}
          aria-label="Slide anterior"
          disabled={max <= 1}
        >
          ‹
        </button>

        <div className={styles.dots} role="tablist" aria-label="Selecionar slide">
          {safeSlides.map((_, slideIndex) => {
            const isActive = slideIndex === index;

            return (
              <button
                key={`${carouselId}-dot-${slideIndex}`}
                id={`${carouselId}-tab-${slideIndex}`}
                type="button"
                role="tab"
                className={`${styles.dot} ${
                  isActive ? styles.dotActive : ""
                }`}
                onClick={() => goTo(slideIndex)}
                aria-label={`Ir para o slide ${slideIndex + 1}`}
                aria-selected={isActive}
                aria-controls={`${carouselId}-slide-${slideIndex}`}
                tabIndex={isActive ? 0 : -1}
              />
            );
          })}
        </div>

        <button
          className={styles.navBtn}
          type="button"
          onClick={next}
          aria-label="Próximo slide"
          disabled={max <= 1}
        >
          ›
        </button>
      </div>
    </section>
  );
}

function MockCard() {
  return (
    <div className={styles.mock} aria-hidden="true">
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