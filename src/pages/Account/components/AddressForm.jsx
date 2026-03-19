import styles from "../Account.module.css";
import Button from "../../../components/ui/Button/Button";

export default function AddressForm({
  editingAddressId,
  addressForm,
  savingAddress,
  onChange,
  onCancel,
  onSave,
}) {
  return (
    <article className={`${styles.card} ${styles.cardWide}`}>
      <div className={styles.cardHeader}>
        <h2>{editingAddressId ? "Editar endereço" : "Novo endereço"}</h2>
      </div>

      <div className={styles.formGrid}>
        <label className={styles.field}>
          <span>Nome do endereço</span>
          <input
            name="label"
            value={addressForm.label || ""}
            onChange={onChange}
            placeholder="Casa, trabalho..."
          />
        </label>

        <label className={styles.field}>
          <span>CEP</span>
          <input
            name="cep"
            value={addressForm.cep || ""}
            onChange={onChange}
            placeholder="00000-000"
            inputMode="numeric"
          />
        </label>

        <label className={`${styles.field} ${styles.fieldFull}`}>
          <span>Endereço</span>
          <input
            name="address"
            value={addressForm.address || ""}
            onChange={onChange}
            placeholder="Rua, avenida..."
          />
        </label>

        <label className={styles.field}>
          <span>Bairro</span>
          <input
            name="district"
            value={addressForm.district || ""}
            onChange={onChange}
            placeholder="Seu bairro"
          />
        </label>

        <label className={styles.field}>
          <span>Cidade</span>
          <input
            name="city"
            value={addressForm.city || ""}
            onChange={onChange}
            placeholder="Cidade"
          />
        </label>

        <label className={styles.field}>
          <span>Estado</span>
          <input
            name="state"
            value={addressForm.state || ""}
            onChange={onChange}
            placeholder="UF"
            maxLength={2}
          />
        </label>

        <label className={styles.field}>
          <span>Número</span>
          <input
            name="number"
            value={addressForm.number || ""}
            onChange={onChange}
            placeholder="123"
          />
        </label>

        <label className={styles.field}>
          <span>Complemento</span>
          <input
            name="complement"
            value={addressForm.complement || ""}
            onChange={onChange}
            placeholder="Casa, apto..."
          />
        </label>

        <label className={`${styles.field} ${styles.fieldFull}`}>
          <span>Referência</span>
          <input
            name="reference"
            value={addressForm.reference || ""}
            onChange={onChange}
            placeholder="Portão azul..."
          />
        </label>

        <label className={styles.checkboxField}>
          <input
            type="checkbox"
            name="is_default"
            checked={addressForm.is_default}
            onChange={onChange}
          />
          <span>Definir como endereço principal</span>
        </label>
      </div>

      <div className={styles.formActions}>
        <Button variant="ghost" size="md" onClick={onCancel}>
          Cancelar
        </Button>

        <Button
          variant="primary"
          size="md"
          onClick={onSave}
          disabled={savingAddress}
        >
          {savingAddress
            ? "Salvando..."
            : editingAddressId
            ? "Salvar alterações"
            : "Salvar endereço"}
        </Button>
      </div>
    </article>
  );
}