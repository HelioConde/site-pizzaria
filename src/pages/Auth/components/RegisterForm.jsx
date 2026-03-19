import { useMemo, useState } from "react";
import Button from "../../../components/ui/Button/Button";
import styles from "../Auth.module.css";
import {
  getPasswordChecklist,
  getPasswordStrength,
} from "../auth.utils";

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
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const passwordStrength = useMemo(
    () => getPasswordStrength(form.password),
    [form.password]
  );

  const passwordChecklist = useMemo(
    () => getPasswordChecklist(form.password),
    [form.password]
  );

  const strengthClass =
    passwordStrength.level === "strong"
      ? styles.passwordStrengthValueStrong
      : passwordStrength.level === "medium"
        ? styles.passwordStrengthValueMedium
        : styles.passwordStrengthValueWeak;

  const barClass =
    passwordStrength.level === "strong"
      ? styles.passwordBarStrong
      : passwordStrength.level === "medium"
        ? styles.passwordBarMedium
        : styles.passwordBarWeak;

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
            inputMode="tel"
            spellCheck={false}
            autoCapitalize="none"
            autoCorrect="off"
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
            inputMode="numeric"
            spellCheck={false}
            autoCapitalize="none"
            autoCorrect="off"
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
            inputMode="text"
            spellCheck={false}
            autoCapitalize="characters"
            autoCorrect="off"
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
            placeholder="Ex: 123, 123A ou S/N"
            inputMode="text"
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
            placeholder="seuemail@provedor.com"
            autoComplete="email"
            inputMode="email"
            spellCheck={false}
            autoCapitalize="none"
            autoCorrect="off"
            required
            aria-invalid={touched.email && !!errors.email}
          />
          {touched.email && errors.email ? (
            <small className={styles.errorText}>{errors.email}</small>
          ) : (
            <small className={styles.helperText}>
              Use um e-mail real. Evite endereços genéricos ou temporários.
            </small>
          )}
        </label>

        <div className={styles.passwordBox}>
          <label className={styles.field}>
            <span>Senha</span>
            <div className={`${styles.inputWrap} ${styles.hasToggle}`}>
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={form.password}
                onChange={onChange}
                onBlur={onBlur}
                placeholder="Crie uma senha forte"
                autoComplete="new-password"
                spellCheck={false}
                autoCapitalize="none"
                autoCorrect="off"
                required
                minLength={8}
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
                Combine letras maiúsculas, minúsculas, números e símbolos.
              </small>
            )}
          </label>

          <div className={styles.passwordStrength}>
            <div className={styles.passwordStrengthTop}>
              <span className={styles.passwordStrengthLabel}>
                Força da senha
              </span>
              <span className={`${styles.passwordStrengthValue} ${strengthClass}`}>
                {passwordStrength.label}
              </span>
            </div>

            <div className={styles.passwordBar}>
              <div className={`${styles.passwordBarFill} ${barClass}`} />
            </div>

            <ul className={styles.passwordTips}>
              {passwordChecklist.map((item) => (
                <li
                  key={item.key}
                  className={`${styles.passwordTip} ${item.valid
                    ? styles.passwordTipValid
                    : styles.passwordTipInvalid
                    }`}
                >
                  {item.valid ? "✓" : "•"} {item.label}
                </li>
              ))}
            </ul>
          </div>

          <label className={styles.field}>
            <span>Confirmar senha</span>
            <div className={`${styles.inputWrap} ${styles.hasToggle}`}>
              <input
                type={showConfirmPassword ? "text" : "password"}
                name="confirmPassword"
                value={form.confirmPassword}
                onChange={onChange}
                onBlur={onBlur}
                placeholder="Digite a senha novamente"
                autoComplete="new-password"
                spellCheck={false}
                autoCapitalize="none"
                autoCorrect="off"
                required
                minLength={8}
                aria-invalid={touched.confirmPassword && !!errors.confirmPassword}
              />
              <button
                type="button"
                className={styles.togglePasswordBtn}
                onClick={() => setShowConfirmPassword((prev) => !prev)}
                aria-label={
                  showConfirmPassword
                    ? "Ocultar confirmação de senha"
                    : "Mostrar confirmação de senha"
                }
              >
                {showConfirmPassword ? "Ocultar" : "Mostrar"}
              </button>
            </div>
            {touched.confirmPassword && errors.confirmPassword ? (
              <small className={styles.errorText}>{errors.confirmPassword}</small>
            ) : (
              <small className={styles.helperText}>
                Repita exatamente a mesma senha.
              </small>
            )}
          </label>
        </div>

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