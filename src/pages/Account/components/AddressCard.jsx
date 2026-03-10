import styles from "../Account.module.css";
import Button from "../../../components/ui/Button/Button";

export default function AddressCard({
  address,
  index,
  settingDefaultId,
  deletingAddressId,
  onEdit,
  onDelete,
  onSetDefault,
  formatCep,
}) {
  return (
    <div className={styles.addressCard}>
      <div className={styles.addressCardTop}>
        <p className={styles.addressCardTitle}>
          <strong>
            {address.label?.trim() || `Endereço ${index + 1}`}
          </strong>
          {address.is_default ? " • Principal" : ""}
        </p>
      </div>

      <p className={styles.addressCardLine}>
        {address.address}, {address.number}
        {address.complement ? ` • ${address.complement}` : ""}
      </p>

      <p className={styles.addressCardLine}>
        {address.district ? `${address.district} • ` : ""}
        {address.city}
        {address.state ? ` - ${address.state}` : ""}
      </p>

      {address.cep && (
        <p className={styles.addressCardLine}>
          CEP: {formatCep(address.cep)}
        </p>
      )}

      {address.reference && (
        <p className={styles.addressCardLine}>
          Referência: {address.reference}
        </p>
      )}

      <div className={styles.addressActions}>
        {!address.is_default && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onSetDefault(address.id)}
            disabled={settingDefaultId === address.id}
          >
            {settingDefaultId === address.id
              ? "Salvando..."
              : "Tornar principal"}
          </Button>
        )}

        <Button
          variant="ghost"
          size="sm"
          onClick={() => onEdit(address)}
        >
          Editar
        </Button>

        <Button
          variant="ghost"
          size="sm"
          className={styles.btnDanger}
          onClick={() => onDelete(address.id)}
          disabled={deletingAddressId === address.id}
        >
          {deletingAddressId === address.id
            ? "Excluindo..."
            : "Excluir"}
        </Button>
      </div>
    </div>
  );
}