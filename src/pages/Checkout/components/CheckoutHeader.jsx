import { Link } from "react-router-dom";
import styles from "../Checkout.module.css";

export default function CheckoutHeader() {
  return (
    <>
      <section className={styles.topBar}>
        <div className={styles.container}>
          <Link to="/menu" className={styles.backBtn}>
            ← Voltar ao cardápio
          </Link>
        </div>
      </section>

      <section className={styles.hero}>
        <div className={styles.container}>
          <span className={styles.kicker}>Checkout</span>
          <h1 className={styles.title}>Finalizar pedido</h1>
          <p className={styles.subtitle}>
            Revise os dados e confirme seu pedido.
          </p>

          <div className={styles.stepper}>
            <div className={`${styles.stepItem} ${styles.stepItemActive}`}>
              <span className={styles.stepDot}>1</span>
              <span>Entrega</span>
            </div>
            <div className={styles.stepLine} />
            <div className={styles.stepItem}>
              <span className={styles.stepDot}>2</span>
              <span>Pagamento</span>
            </div>
            <div className={styles.stepLine} />
            <div className={styles.stepItem}>
              <span className={styles.stepDot}>3</span>
              <span>Confirmação</span>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}