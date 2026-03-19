import styles from "../Checkout.module.css";

export default function CheckoutHelpCard() {
  return (
    <section className={styles.helpCard}>
      <h3 className={styles.helpTitle}>Precisa de ajuda?</h3>
      <p className={styles.helpText}>
        Revise os dados com calma. Seu carrinho continua salvo mesmo se você
        voltar ao cardápio.
      </p>
      <p className={styles.helpText}>
        O pedido só é concluído depois da confirmação de pagamento ou da
        finalização da compra.
      </p>
    </section>
  );
}