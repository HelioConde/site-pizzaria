import styles from "../Account.module.css";
import AddressCard from "./AddressCard";
import Button from "../../../components/ui/Button/Button";

export default function AddressList({
  loading,
  addresses,
  settingDefaultId,
  deletingAddressId,
  onAdd,
  onEdit,
  onDelete,
  onSetDefault,
  formatCep,
}) {
  return (
    <article className={`${styles.card} ${styles.cardWide}`}>
      <div className={styles.cardHeader}>
        <h2>Meus endereços</h2>

        <Button variant="primary" size="sm" onClick={onAdd}>
          Adicionar endereço
        </Button>
      </div>

      {loading ? (
        <div className={styles.emptyState}>
          <p>Carregando endereços...</p>
        </div>
      ) : addresses.length === 0 ? (
        <div className={styles.emptyState}>
          <p>Nenhum endereço cadastrado.</p>
          <span>Adicione seu primeiro endereço para usar no checkout.</span>
        </div>
      ) : (
        <div className={styles.addressList}>
          {addresses.map((address, index) => (
            <AddressCard
              key={address.id}
              address={address}
              index={index}
              settingDefaultId={settingDefaultId}
              deletingAddressId={deletingAddressId}
              onEdit={onEdit}
              onDelete={onDelete}
              onSetDefault={onSetDefault}
              formatCep={formatCep}
            />
          ))}
        </div>
      )}
    </article>
  );
}