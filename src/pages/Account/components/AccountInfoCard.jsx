import styles from "../Account.module.css";

export default function AccountInfoCard({ name, email, phone }) {
  return (
    <article className={styles.card}>
      <div className={styles.cardHeader}>
        <h2>Dados da conta</h2>
      </div>

      <div className={styles.infoList}>
        <div className={styles.infoItem}>
          <span>Nome</span>
          <strong>{name || "Não informado"}</strong>
        </div>

        <div className={styles.infoItem}>
          <span>E-mail</span>
          <strong>{email || "Não informado"}</strong>
        </div>

        <div className={styles.infoItem}>
          <span>Telefone</span>
          <strong>{phone || "Não informado"}</strong>
        </div>
      </div>
    </article>
  );
}