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
        {[
          ["label", "Nome do endereço", "Casa, trabalho..."],
          ["cep", "CEP", "00000-000"],
          ["address", "Endereço", "Rua, avenida..."],
          ["district", "Bairro", "Seu bairro"],
          ["city", "Cidade", "Cidade"],
          ["state", "Estado", "UF"],
          ["number", "Número", "123"],
          ["complement", "Complemento", "Casa, apto..."],
          ["reference", "Referência", "Portão azul..."],
        ].map(([name, label, placeholder]) => (
          <label
            key={name}
            className={`${styles.field} ${
              name === "address" || name === "reference"
                ? styles.fieldFull
                : ""
            }`}
          >
            <span>{label}</span>
            <input
              name={name}
              value={addressForm[name] || ""}
              onChange={onChange}
              placeholder={placeholder}
            />
          </label>
        ))}

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