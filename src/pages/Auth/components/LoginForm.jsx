import { useState } from "react";
import Button from "../../../components/ui/Button/Button";
import styles from "../Auth.module.css";

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
  const [showPassword, setShowPassword] = useState(false);

  return (
    <form className={styles.form} onSubmit={onSubmit} noValidate>
      <label className={styles.field}>
        <span>E-mail</span>
        <div className={styles.inputWrap}>
          <input
            type="email"
            name="email"
            value={form.email}
            onChange={onChange}
            onBlur={onBlur}
            placeholder="seuemail@provedor.com"
            autoComplete="email"
            inputMode="email"
            spellCheck={false}
            autoCapitalize="none"
            autoCorrect="off"
            required
            aria-invalid={touched.email && !!errors.email}
          />
        </div>
        {touched.email && errors.email ? (
          <small className={styles.errorText}>{errors.email}</small>
        ) : (
          <small className={styles.helperText}>
            Digite seu e-mail real para acessar sua conta.
          </small>
        )}
      </label>

      <label className={styles.field}>
        <span>Senha</span>
        <div className={`${styles.inputWrap} ${styles.hasToggle}`}>
          <input
            type={showPassword ? "text" : "password"}
            name="password"
            value={form.password}
            onChange={onChange}
            onBlur={onBlur}
            placeholder="Digite sua senha"
            autoComplete="current-password"
            spellCheck={false}
            autoCapitalize="none"
            autoCorrect="off"
            required
            minLength={6}
            aria-invalid={touched.password && !!errors.password}
          />
          <button
            type="button"
            className={styles.togglePasswordBtn}
            onClick={() => setShowPassword((prev) => !prev)}
            aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
          >
            {showPassword ? "Ocultar" : "Mostrar"}
          </button>
        </div>
        {touched.password && errors.password ? (
          <small className={styles.errorText}>{errors.password}</small>
        ) : (
          <small className={styles.helperText}>
            Confira se o Caps Lock não está ativado.
          </small>
        )}
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