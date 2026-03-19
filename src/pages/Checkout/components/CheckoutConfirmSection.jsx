import Button from "../../../components/ui/Button/Button";
import styles from "../Checkout.module.css";

export default function CheckoutConfirmSection({
  paymentMethod,
  paymentMethods,
  isSubmitting,
  onConfirm,
  confirmValidationError,
}) {
  const isOnlinePayment = paymentMethod === paymentMethods.ONLINE;
  const isCashPayment = paymentMethod === paymentMethods.CASH;
  const isCardOnDelivery = paymentMethod === paymentMethods.CARD_ON_DELIVERY;

  function getConfirmationText() {
    if (isOnlinePayment) {
      return "Ao confirmar, você será redirecionado para a página segura de pagamento. O pedido será concluído após a finalização do pagamento.";
    }

    if (isCashPayment) {
      return "Ao confirmar, seu pedido será enviado com pagamento em dinheiro na entrega.";
    }

    if (isCardOnDelivery) {
      return "Ao confirmar, seu pedido será enviado com pagamento na maquininha na entrega.";
    }

    return "O pedido só será processado após a confirmação desta etapa.";
  }

  return (
    <div className={styles.confirmSection}>
      <h3 className={styles.summaryDeliveryTitle}>Confirmação do pedido</h3>

      <p className={styles.confirmHelp}>{getConfirmationText()}</p>

      <Button
        type="button"
        variant="primary"
        size="md"
        onClick={onConfirm}
        disabled={isSubmitting || Boolean(confirmValidationError)}
        className={styles.confirmBtn}
        title={confirmValidationError || ""}
      >
        {isSubmitting
          ? "Confirmando..."
          : isOnlinePayment
          ? "Ir para pagamento"
          : "Confirmar pedido"}
      </Button>

      {confirmValidationError ? (
        <p className={styles.confirmHelp}>{confirmValidationError}</p>
      ) : null}
    </div>
  );
}