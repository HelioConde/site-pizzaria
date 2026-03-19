import { Link } from "react-router-dom";
import Button from "../../ui/Button/Button";
import styles from "./FinalCta.module.css";

export default function FinalCta() {
  return (
    <section className={styles.wrap} aria-label="Chamada para ação final">
      <div className={styles.container}>
        <div className={styles.left}>
          <h2 className={styles.title}>Pronto para pedir sua pizza?</h2>
          <p className={styles.subtitle}>
            Abra o cardápio e finalize em poucos cliques. Experiência rápida e
            moderna.
          </p>
        </div>

        <div className={styles.right}>
          <Button as={Link} to="/menu" variant="ghostOnRed" size="md">
            Fazer pedido agora <span aria-hidden="true">→</span>
          </Button>
        </div>
      </div>
    </section>
  );
}