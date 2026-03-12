import styles from "../Auth.module.css";
import Button from "../../../components/ui/Button/Button";

export default function RegisterForm({
  form,
  touched,
  errors,
  loading,
  isValid,
  onChange,
  onBlur,
  onSubmit,
}) {
  return (
    <form className={styles.form} onSubmit={onSubmit} noValidate>
      <div className={styles.formGrid}>
        <label className={styles.field}>
          <span>Nome</span>
          <input
            type="text"
            name="name"
            value={form.name}
            onChange={onChange}
            onBlur={onBlur}
            placeholder="Seu nome completo"
            autoComplete="name"
            required
            minLength={3}
            aria-invalid={touched.name && !!errors.name}
          />
          {touched.name && errors.name ? (
            <small className={styles.errorText}>{errors.name}</small>
          ) : null}
        </label>

        <label className={styles.field}>
          <span>Telefone</span>
          <input
            type="tel"
            name="phone"
            value={form.phone}
            onChange={onChange}
            onBlur={onBlur}
            placeholder="(61) 99999-9999"
            autoComplete="tel"
            required
            aria-invalid={touched.phone && !!errors.phone}
          />
          {touched.phone && errors.phone ? (
            <small className={styles.errorText}>{errors.phone}</small>
          ) : null}
        </label>

        <label className={styles.field}>
          <span>CEP</span>
          <input
            type="text"
            name="cep"
            value={form.cep}
            onChange={onChange}
            onBlur={onBlur}
            placeholder="00000-000"
            autoComplete="postal-code"
            aria-invalid={touched.cep && !!errors.cep}
          />
          {touched.cep && errors.cep ? (
            <small className={styles.errorText}>{errors.cep}</small>
          ) : null}
        </label>

        <label className={styles.field}>
          <span>Endereço</span>
          <input
            type="text"
            name="address"
            value={form.address}
            onChange={onChange}
            onBlur={onBlur}
            placeholder="Rua, avenida..."
            autoComplete="address-line1"
            required
            aria-invalid={touched.address && !!errors.address}
          />
          {touched.address && errors.address ? (
            <small className={styles.errorText}>{errors.address}</small>
          ) : null}
        </label>

        <label className={styles.field}>
          <span>Bairro</span>
          <input
            type="text"
            name="district"
            value={form.district}
            onChange={onChange}
            onBlur={onBlur}
            placeholder="Seu bairro"
            required
            aria-invalid={touched.district && !!errors.district}
          />
          {touched.district && errors.district ? (
            <small className={styles.errorText}>{errors.district}</small>
          ) : null}
        </label>

        <label className={styles.field}>
          <span>Cidade</span>
          <input
            type="text"
            name="city"
            value={form.city}
            onChange={onChange}
            onBlur={onBlur}
            placeholder="Sua cidade"
            autoComplete="address-level2"
            required
            aria-invalid={touched.city && !!errors.city}
          />
          {touched.city && errors.city ? (
            <small className={styles.errorText}>{errors.city}</small>
          ) : null}
        </label>

        <label className={styles.field}>
          <span>Estado</span>
          <input
            type="text"
            name="state"
            value={form.state}
            onChange={onChange}
            onBlur={onBlur}
            placeholder="DF"
            autoComplete="address-level1"
            required
            maxLength={2}
            aria-invalid={touched.state && !!errors.state}
          />
          {touched.state && errors.state ? (
            <small className={styles.errorText}>{errors.state}</small>
          ) : null}
        </label>

        <label className={styles.field}>
          <span>Número</span>
          <input
            type="text"
            name="number"
            value={form.number}
            onChange={onChange}
            onBlur={onBlur}
            placeholder="123"
            autoComplete="address-line2"
            required
            aria-invalid={touched.number && !!errors.number}
          />
          {touched.number && errors.number ? (
            <small className={styles.errorText}>{errors.number}</small>
          ) : null}
        </label>

        <label className={styles.field}>
          <span>Complemento</span>
          <input
            type="text"
            name="complement"
            value={form.complement}
            onChange={onChange}
            placeholder="Casa, apto, bloco..."
            autoComplete="off"
          />
        </label>

        <label className={styles.field}>
          <span>Referência</span>
          <input
            type="text"
            name="reference"
            value={form.reference}
            onChange={onChange}
            placeholder="Próximo ao mercado, portão azul..."
            autoComplete="off"
          />
        </label>

        <label className={styles.field}>
          <span>E-mail</span>
          <input
            type="email"
            name="email"
            value={form.email}
            onChange={onChange}
            onBlur={onBlur}
            placeholder="exemplo@gmail.com"
            autoComplete="email"
            required
            aria-invalid={touched.email && !!errors.email}
          />
          {touched.email && errors.email ? (
            <small className={styles.errorText}>{errors.email}</small>
          ) : null}
        </label>

        <label className={styles.field}>
          <span>Senha</span>
          <input
            type="password"
            name="password"
            value={form.password}
            onChange={onChange}
            onBlur={onBlur}
            placeholder="Mínimo 6 caracteres"
            autoComplete="new-password"
            required
            minLength={6}
            aria-invalid={touched.password && !!errors.password}
          />
          {touched.password && errors.password ? (
            <small className={styles.errorText}>{errors.password}</small>
          ) : null}
        </label>
      </div>

      <Button
        type="submit"
        variant="primary"
        size="md"
        disabled={loading || !isValid}
      >
        {loading ? "Criando conta..." : "Criar conta"}
      </Button>
    </form>
  );
}