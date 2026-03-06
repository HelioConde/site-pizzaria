import styles from "./FinalCta.module.css";
import Button from "../../ui/Button/Button";

export default function FinalCta() {
  return (
    <section className={styles.wrap} aria-label="Chamada para ação final">
      <div className={styles.container}>
        <div className={styles.left}>
          <h2 className={styles.title}>Pronto para pedir sua pizza?</h2>
          <p className={styles.subtitle}>
            Abra o cardápio e finalize em poucos cliques. Experiência rápida e moderna.
          </p>
        </div>

        <div className={styles.right}>
          <Button as="a" href="#fazer-pedido" variant="inverse" size="md">
            Fazer pedido agora <span aria-hidden="true">→</span>
          </Button>
        </div>
      </div>
    </section>
  );
}