import { useEffect, useRef } from "react";
import styles from "./Toast.module.css";

const TOAST_DURATION = 4000;
const EXIT_DURATION = 220;

function getToastRole(type) {
  if (type === "error" || type === "warning") {
    return "alert";
  }

  return "status";
}

export default function ToastContainer({ toasts = [], onRemove }) {
  const timeoutMapRef = useRef(new Map());
  const closingMapRef = useRef(new Map());

  useEffect(() => {
    if (!Array.isArray(toasts)) return;

    toasts.forEach((toast) => {
      if (!toast?.id) return;
      if (timeoutMapRef.current.has(toast.id)) return;

      const timeoutId = setTimeout(() => {
        handleRemove(toast.id);
      }, TOAST_DURATION);

      timeoutMapRef.current.set(toast.id, timeoutId);
    });

    const activeIds = new Set(
      toasts.map((toast) => toast?.id).filter(Boolean)
    );

    Array.from(timeoutMapRef.current.keys()).forEach((id) => {
      if (activeIds.has(id)) return;

      clearTimeout(timeoutMapRef.current.get(id));
      timeoutMapRef.current.delete(id);
    });

    Array.from(closingMapRef.current.keys()).forEach((id) => {
      if (activeIds.has(id)) return;

      clearTimeout(closingMapRef.current.get(id));
      closingMapRef.current.delete(id);
    });
  }, [toasts]);

  useEffect(() => {
    return () => {
      timeoutMapRef.current.forEach((timeoutId) => {
        clearTimeout(timeoutId);
      });

      closingMapRef.current.forEach((timeoutId) => {
        clearTimeout(timeoutId);
      });

      timeoutMapRef.current.clear();
      closingMapRef.current.clear();
    };
  }, []);

  function safeRemove(id) {
    if (typeof onRemove === "function") {
      onRemove(id);
    }
  }

  function handleRemove(id) {
    if (!id) return;
    if (closingMapRef.current.has(id)) return;

    const activeElement = document.querySelector(
      `[data-toast-id="${String(id)}"]`
    );

    if (activeElement) {
      activeElement.setAttribute("data-closing", "true");
    }

    const openTimeout = timeoutMapRef.current.get(id);
    if (openTimeout) {
      clearTimeout(openTimeout);
      timeoutMapRef.current.delete(id);
    }

    const closeTimeout = setTimeout(() => {
      safeRemove(id);
      closingMapRef.current.delete(id);
    }, EXIT_DURATION);

    closingMapRef.current.set(id, closeTimeout);
  }

  if (!Array.isArray(toasts) || toasts.length === 0) {
    return null;
  }

  return (
    <div
      className={styles.toastContainer}
      aria-live="polite"
      aria-atomic="false"
      aria-relevant="additions removals"
    >
      {toasts.map((toast, index) => {
        const id = toast?.id ?? `toast-${index}`;
        const title =
          typeof toast?.title === "string" && toast.title.trim()
            ? toast.title.trim()
            : "Aviso";
        const message =
          typeof toast?.message === "string" && toast.message.trim()
            ? toast.message.trim()
            : "";
        const type =
          typeof toast?.type === "string" && toast.type.trim()
            ? toast.type.trim().toLowerCase()
            : "info";

        const typeClass =
          type === "success"
            ? styles.success
            : type === "error"
              ? styles.error
              : type === "warning"
                ? styles.warning
                : styles.info;

        return (
          <div
            key={id}
            data-toast-id={id}
            className={`${styles.toast} ${typeClass}`}
            role={getToastRole(type)}
          >
            <div className={styles.toastContent}>
              <strong className={styles.toastTitle}>{title}</strong>
              {message ? (
                <span className={styles.toastMessage}>{message}</span>
              ) : null}
            </div>

            <button
              type="button"
              className={styles.closeBtn}
              onClick={() => handleRemove(id)}
              aria-label={`Fechar notificação: ${title}`}
            >
              ×
            </button>
          </div>
        );
      })}
    </div>
  );
}