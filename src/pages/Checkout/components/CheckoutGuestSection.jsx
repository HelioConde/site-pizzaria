import styles from "../Checkout.module.css";
import CheckoutDeliveryForm from "./CheckoutDeliveryForm";

export default function CheckoutGuestSection({
  deliveryForm,
  handleDeliveryChange,
  onBackToModeSelection,
}) {
  return (
    <section className={styles.card}>
      <div className={styles.sectionHeader}>
        <div>
          <h2 className={styles.sectionTitle}>Dados de entrega</h2>
          <p className={styles.sectionDesc}>
            Informe seu endereço para finalizar o pedido.
          </p>
        </div>

        <button
          type="button"
          className={styles.changeModeBtn}
          onClick={onBackToModeSelection}
        >
          Usar conta
        </button>
      </div>

      <CheckoutDeliveryForm
        deliveryForm={deliveryForm}
        handleDeliveryChange={handleDeliveryChange}
      />
    </section>
  );
}   