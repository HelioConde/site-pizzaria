import styles from "../Account.module.css";

export default function DefaultAddressCard({ loading, defaultAddress, formatCep }) {
  return (
    <article className={styles.card}>
      <div className={styles.cardHeader}>
        <h2>Endereço principal</h2>
      </div>

      {loading ? (
        <div className={styles.emptyState}>
          <p>Carregando endereços...</p>
        </div>
      ) : defaultAddress ? (
        <div className={styles.addressBox}>
          <strong>
            {defaultAddress.label?.trim() || "Endereço principal"} • Principal
          </strong>

          <span>
            {defaultAddress.address}, {defaultAddress.number}
            {defaultAddress.complement ? ` • ${defaultAddress.complement}` : ""}
          </span>

          <span>
            {defaultAddress.district ? `${defaultAddress.district} • ` : ""}
            {defaultAddress.city}
            {defaultAddress.state ? ` - ${defaultAddress.state}` : ""}
          </span>

          {defaultAddress.cep && (
            <span>CEP: {formatCep(defaultAddress.cep)}</span>
          )}

          {defaultAddress.reference && (
            <span>Referência: {defaultAddress.reference}</span>
          )}
        </div>
      ) : (
        <div className={styles.emptyState}>
          <p>Você ainda não possui endereços salvos.</p>
          <span>Adicione um endereço para agilizar seus próximos pedidos.</span>
        </div>
      )}
    </article>
  );
}