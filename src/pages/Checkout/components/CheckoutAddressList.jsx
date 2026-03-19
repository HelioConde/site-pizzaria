import Button from "../../../components/ui/Button/Button";
import styles from "../Checkout.module.css";

export default function CheckoutAddressList({
  savedAddresses,
  selectedAddressId,
  onSelectAddress,
  onDeleteAddress,
  isDeletingAddress,
}) {
  return (
    <div className={styles.addressList}>
      {savedAddresses.map((addr, index) => (
        <div
          key={addr.id}
          className={`${styles.addressCard} ${
            selectedAddressId === addr.id ? styles.addressCardActive : ""
          }`}
        >
          <p className={styles.addressCardTitle}>
            <strong>{addr.label?.trim() || `Endereço ${index + 1}`}</strong>
            {addr.is_default ? " • Principal" : ""}
          </p>

          <p className={styles.addressCardLine}>
            {addr.address}, {addr.number}
          </p>

          {addr.complement ? (
            <p className={styles.addressCardLine}>
              Complemento: {addr.complement}
            </p>
          ) : null}

          {addr.reference ? (
            <p className={styles.addressCardLine}>
              Referência: {addr.reference}
            </p>
          ) : null}

          <p className={styles.addressCardLine}>
            {addr.district ? `${addr.district} • ` : ""}
            {addr.city}
            {addr.state ? ` - ${addr.state}` : ""}
          </p>

          <div className={styles.addressActions}>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onSelectAddress(addr)}
            >
              Usar este
            </Button>

            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onDeleteAddress(addr.id)}
              disabled={isDeletingAddress}
            >
              Excluir
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}