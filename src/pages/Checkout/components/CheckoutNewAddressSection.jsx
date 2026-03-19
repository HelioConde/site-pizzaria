import Button from "../../../components/ui/Button/Button";
import styles from "../Checkout.module.css";
import CheckoutDeliveryForm from "./CheckoutDeliveryForm";

export default function CheckoutNewAddressSection({
  deliveryForm,
  handleDeliveryChange,
  handleSaveNewAddress,
  isSavingAddress,
}) {
  return (
    <section className={styles.card}>
      <div>
        <span className={styles.formBadge}>Novo endereço</span>
        <h2 className={styles.sectionTitle}>Salvar endereço</h2>
        <p className={styles.sectionDesc}>
          Preencha os dados e use este endereço na conta.
        </p>
      </div>

      <CheckoutDeliveryForm
        deliveryForm={deliveryForm}
        handleDeliveryChange={handleDeliveryChange}
      />

      <div className={styles.formActions}>
        <Button
          type="button"
          variant="primary"
          size="md"
          onClick={handleSaveNewAddress}
          disabled={isSavingAddress}
        >
          {isSavingAddress ? "Salvando..." : "Salvar e usar endereço"}
        </Button>
      </div>
    </section>
  );
}