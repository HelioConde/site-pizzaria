import styles from "../Checkout.module.css";
import CheckoutAddressList from "./CheckoutAddressList";

export default function CheckoutAccountSection({
  user,
  savedAddresses,
  selectedAddressId,
  isDeletingAddress,
  onSignOut,
  onStartNewAddress,
  onSelectAddress,
  onDeleteAddress,
}) {
  return (
    <section className={styles.card}>
      <div className={styles.newAddressBlock}>
        <div className={styles.sectionHeader}>
          <div>
            <h2 className={styles.sectionTitle}>Dados da conta</h2>
            <p className={styles.sectionDesc}>
              Conta conectada: <strong>{user?.email}</strong>
            </p>
          </div>

          <button
            type="button"
            className={styles.changeModeBtn}
            onClick={onSignOut}
          >
            Trocar conta
          </button>
        </div>

        {savedAddresses.length > 0 ? (
          <>
            <div className={styles.sectionHeader}>
              <div>
                <h2 className={styles.sectionTitle}>Seus endereços</h2>
                <p className={styles.sectionDesc}>
                  Escolha um endereço salvo ou adicione um novo.
                </p>
              </div>

              <button
                type="button"
                className={styles.changeModeBtn}
                onClick={onStartNewAddress}
              >
                + Novo endereço
              </button>
            </div>

            <CheckoutAddressList
              savedAddresses={savedAddresses}
              selectedAddressId={selectedAddressId}
              onSelectAddress={onSelectAddress}
              onDeleteAddress={onDeleteAddress}
              isDeletingAddress={isDeletingAddress}
            />
          </>
        ) : null}
      </div>
    </section>
  );
}