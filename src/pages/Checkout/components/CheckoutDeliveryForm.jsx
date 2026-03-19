import styles from "../Checkout.module.css";

export default function CheckoutDeliveryForm({
  deliveryForm,
  handleDeliveryChange,
}) {
  return (
    <div className={styles.formGrid}>
      <label className={styles.field}>
        <span>CEP</span>
        <input
          type="text"
          name="cep"
          value={deliveryForm.cep}
          onChange={handleDeliveryChange}
          placeholder="00000-000"
          inputMode="numeric"
          autoComplete="postal-code"
          spellCheck={false}
          autoCapitalize="none"
          autoCorrect="off"
        />
      </label>

      <label className={styles.field}>
        <span>Bairro</span>
        <input
          type="text"
          name="district"
          value={deliveryForm.district}
          onChange={handleDeliveryChange}
          placeholder="Seu bairro"
          autoComplete="address-level3"
        />
      </label>

      <label className={`${styles.field} ${styles.fieldFull}`}>
        <span>Endereço</span>
        <input
          type="text"
          name="address"
          value={deliveryForm.address}
          onChange={handleDeliveryChange}
          placeholder="Rua, avenida..."
          autoComplete="address-line1"
        />
      </label>

      <label className={styles.field}>
        <span>Número</span>
        <input
          type="text"
          name="number"
          value={deliveryForm.number}
          onChange={handleDeliveryChange}
          placeholder="Ex: 123, 123A ou S/N"
          inputMode="text"
          autoComplete="address-line2"
          spellCheck={false}
          autoCapitalize="characters"
          autoCorrect="off"
        />
      </label>

      <label className={styles.field}>
        <span>Complemento</span>
        <input
          type="text"
          name="complement"
          value={deliveryForm.complement}
          onChange={handleDeliveryChange}
          placeholder="Casa, apto, bloco..."
          autoComplete="off"
        />
      </label>

      <label className={styles.field}>
        <span>Cidade</span>
        <input
          type="text"
          name="city"
          value={deliveryForm.city}
          onChange={handleDeliveryChange}
          placeholder="Cidade"
          autoComplete="address-level2"
        />
      </label>

      <label className={styles.field}>
        <span>Estado</span>
        <input
          type="text"
          name="state"
          value={deliveryForm.state}
          onChange={handleDeliveryChange}
          placeholder="UF"
          maxLength={2}
          inputMode="text"
          autoComplete="address-level1"
          spellCheck={false}
          autoCapitalize="characters"
          autoCorrect="off"
        />
      </label>

      <label className={`${styles.field} ${styles.fieldFull}`}>
        <span>Referência</span>
        <input
          type="text"
          name="reference"
          value={deliveryForm.reference}
          onChange={handleDeliveryChange}
          placeholder="Próximo ao mercado, portão azul..."
          autoComplete="off"
        />
      </label>

      <label className={styles.field}>
        <span>Nome</span>
        <input
          type="text"
          name="name"
          value={deliveryForm.name}
          onChange={handleDeliveryChange}
          placeholder="Seu nome"
          autoComplete="name"
        />
      </label>

      <label className={styles.field}>
        <span>Telefone</span>
        <input
          type="tel"
          name="phone"
          value={deliveryForm.phone}
          onChange={handleDeliveryChange}
          placeholder="(61) 99999-9999"
          inputMode="tel"
          autoComplete="tel"
          spellCheck={false}
          autoCapitalize="none"
          autoCorrect="off"
        />
      </label>
    </div>
  );
}