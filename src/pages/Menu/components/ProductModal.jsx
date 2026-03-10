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
}) {
  if (!open || !product) return null;

  return (
    <div
      className={styles.productModalOverlay}
      onClick={onClose}
      aria-hidden={!open}
    >
      <div
        className={styles.productModal}
        onClick={(e) => e.stopPropagation()}
        aria-label="Personalizar produto"
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

        <div className={styles.notesWrap}>
          <label htmlFor="product-notes" className={styles.optionTitle}>
            Observações
          </label>

          <textarea
            id="product-notes"
            className={styles.notesField}
            placeholder="Ex: massa bem assada, sem muito molho..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
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