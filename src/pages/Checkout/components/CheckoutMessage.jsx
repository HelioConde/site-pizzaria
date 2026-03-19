import styles from "../Checkout.module.css";

export default function CheckoutMessage({ cepLoading, isGeocoding, canShowMap, message }) {
  if (cepLoading) {
    return <p className={styles.checkoutMessage}>Buscando CEP...</p>;
  }

  if (isGeocoding && canShowMap) {
    return (
      <p className={styles.checkoutMessage}>
        Localizando endereço no mapa...
      </p>
    );
  }

  if (message) {
    return (
      <p className={styles.checkoutMessage} role="alert">
        {message}
      </p>
    );
  }

  return null;
}