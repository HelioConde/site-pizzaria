import { Link } from "react-router-dom";
import Button from "../../ui/Button/Button";
import styles from "./FinalCta.module.css";

export default function FinalCta() {
  return (
    <section className={styles.wrap} aria-label="Chamada para ação final">
      <div className={styles.container}>
        <div className={styles.left}>
          <span className={styles.eyebrow}>Um bom pedido começa aqui</span>
          <h2 className={styles.title}>Pronto para pedir sua pizza?</h2>
          <p className={styles.subtitle}>
            Escolha seu sabor favorito, personalize os ingredientes e confira
            tudo antes de finalizar.
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