import { useEffect } from "react";
import styles from "./ConfirmDialog.module.css";

export default function ConfirmDialog({
  open,
  title = "Confirmação",
  description = "Tem certeza que deseja continuar?",
  confirmText = "Confirmar",
  cancelText = "Cancelar",
  onConfirm,
  onCancel,
  loading = false,
}) {
  useEffect(() => {
    if (!open) return;

    function handleKeyDown(event) {
      if (event.key === "Escape" && !loading) {
        onCancel?.();
      }
    }

    document.addEventListener("keydown", handleKeyDown);

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, loading, onCancel]);

  if (!open) return null;

  return (
    <div
      className={styles.overlay}
      onClick={() => {
        if (!loading) {
          onCancel?.();
        }
      }}
    >
      <div
        className={styles.modal}
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        aria-describedby="confirm-dialog-description"
      >
        <h3 id="confirm-dialog-title" className={styles.title}>
          {title}
        </h3>

        <p id="confirm-dialog-description" className={styles.description}>
          {description}
        </p>

        <div className={styles.actions}>
          <button
            type="button"
            className={styles.cancelButton}
            onClick={onCancel}
            disabled={loading}
          >
            {cancelText}
          </button>

          <button
            type="button"
            className={styles.confirmButton}
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? "Processando..." : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}