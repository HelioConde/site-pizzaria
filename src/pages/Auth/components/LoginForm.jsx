import styles from "../Auth.module.css";
import Button from "../../../components/ui/Button/Button";

export default function LoginForm({
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
          placeholder="Digite sua senha"
          autoComplete="current-password"
          required
          minLength={6}
          aria-invalid={touched.password && !!errors.password}
        />
        {touched.password && errors.password ? (
          <small className={styles.errorText}>{errors.password}</small>
        ) : null}
      </label>

      <Button
        type="submit"
        variant="primary"
        size="md"
        disabled={loading || !isValid}
      >
        {loading ? "Entrando..." : "Entrar"}
      </Button>
    </form>
  );
}