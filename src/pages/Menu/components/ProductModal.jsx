import { useEffect, useRef } from "react";
import styles from "../Menu.module.css";
import Button from "../../../components/ui/Button/Button";

export default function ProductModal({
  open,
  product,
  notes,
  setNotes,
  withoutOnion,
  setWithoutOnion,
  withoutTomato,
  setWithoutTomato,
  withoutOlive,
  setWithoutOlive,
  onClose,
  onConfirm,
  formatPrice,
  maxNotesLength = 220,
}) {
  const dialogRef = useRef(null);
  useEffect(() => {
    if (!open || !product) return undefined;
    const previousFocus = document.activeElement;
    const dialog = dialogRef.current;
    dialog?.querySelector("button")?.focus();
    function handleKeyDown(event) {
      if (event.key === "Escape") onClose();
      if (event.key !== "Tab" || !dialog) return;
      const elements = [...dialog.querySelectorAll('button:not([disabled]),input:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])')];
      if (!elements.length) return;
      const first = elements[0], last = elements[elements.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => { document.removeEventListener("keydown", handleKeyDown); previousFocus?.focus?.(); };
  }, [open, product, onClose]);
  if (!open || !product) return null;

  const showIngredientOptions = !!product.isCustomizable;

  return (
    <div
      className={styles.productModalOverlay}
      onClick={onClose}
      aria-hidden={!open}
    >
      <div
        className={styles.productModal}
        ref={dialogRef}
        onClick={(e) => e.stopPropagation()}
        aria-label="Personalizar produto"
        role="dialog"
        aria-modal="true"
      >
        <div className={styles.productModalHead}>
          <div>
            <h2 className={styles.productModalTitle}>{product.name}</h2>
            <p className={styles.productModalPrice}>
              {formatPrice(product.price)}
            </p>
          </div>

          <button
            type="button"
            className={styles.closeBtn}
            onClick={onClose}
            aria-label="Fechar personalização"
          >
            ✕
          </button>
        </div>

        <p className={styles.productModalDesc}>{product.description}</p>

        {showIngredientOptions ? (
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
        ) : null}

        <div className={styles.notesWrap}>
          <label htmlFor="product-notes" className={styles.optionTitle}>
            Observações
          </label>

          <textarea
            id="product-notes"
            className={styles.notesField}
            placeholder={
              showIngredientOptions
                ? "Ex: massa bem assada, sem muito molho..."
                : "Ex: bem gelado, sem gelo, enviar colher..."
            }
            value={notes}
            maxLength={maxNotesLength}
            onChange={(e) => setNotes(e.target.value)}
          />

          <span className={styles.notesHint}>
            {notes.length}/{maxNotesLength} caracteres
          </span>
        </div>

        <div className={styles.productModalActions}>
          <Button
            type="button"
            variant="ghost"
            size="md"
            onClick={onClose}
          >
            Cancelar
          </Button>

          <Button
            type="button"
            variant="primary"
            size="md"
            onClick={onConfirm}
          >
            Adicionar ao carrinho
          </Button>
        </div>
      </div>
    </div>
  );
}