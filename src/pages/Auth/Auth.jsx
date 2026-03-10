import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import styles from "./Auth.module.css";
import Button from "../../components/ui/Button/Button";

const initialRegisterForm = {
  name: "",
  phone: "",
  cep: "",
  address: "",
  district: "",
  city: "",
  state: "",
  number: "",
  complement: "",
  reference: "",
  email: "",
  password: "",
};

const initialLoginForm = {
  email: "",
  password: "",
};

const initialTouched = {
  name: false,
  phone: false,
  cep: false,
  address: false,
  district: false,
  city: false,
  state: false,
  number: false,
  email: false,
  password: false,
};

function normalizeSpaces(value) {
  return value.replace(/\s+/g, " ").trim();
}

function onlyDigits(value) {
  return value.replace(/\D/g, "");
}

function formatCep(value) {
  const digits = onlyDigits(value).slice(0, 8);
  if (digits.length <= 5) return digits;
  return `${digits.slice(0, 5)}-${digits.slice(5)}`;
}

function formatPhone(value) {
  const digits = onlyDigits(value).slice(0, 11);

  if (digits.length <= 2) return digits;
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

function validateRegisterForm(form) {
  const errors = {};

  const name = normalizeSpaces(form.name);
  const email = form.email.trim().toLowerCase();
  const password = form.password;
  const phoneDigits = onlyDigits(form.phone);
  const cepDigits = onlyDigits(form.cep);
  const address = normalizeSpaces(form.address);
  const district = normalizeSpaces(form.district);
  const city = normalizeSpaces(form.city);
  const state = form.state.trim().toUpperCase();
  const number = normalizeSpaces(form.number);

  if (!name || name.length < 3) {
    errors.name = "Informe um nome com pelo menos 3 caracteres.";
  }

  if (!phoneDigits || phoneDigits.length < 10 || phoneDigits.length > 11) {
    errors.phone = "Informe um telefone válido com DDD.";
  }

  if (form.cep && cepDigits.length !== 8) {
    errors.cep = "O CEP deve ter 8 números.";
  }

  if (!address || address.length < 3) {
    errors.address = "Informe um endereço válido.";
  }

  if (!district || district.length < 2) {
    errors.district = "Informe o bairro.";
  }

  if (!city || city.length < 2) {
    errors.city = "Informe a cidade.";
  }

  if (!state || state.length !== 2) {
    errors.state = "Informe a UF com 2 letras.";
  }

  if (!number || number.length < 1) {
    errors.number = "Informe o número do endereço.";
  }

  if (!email || !validateEmail(email)) {
    errors.email = "Informe um e-mail válido.";
  }

  if (!password || password.length < 6) {
    errors.password = "A senha deve ter pelo menos 6 caracteres.";
  }

  return errors;
}

function validateLoginForm(form) {
  const errors = {};

  if (!form.email.trim() || !validateEmail(form.email)) {
    errors.email = "Informe um e-mail válido.";
  }

  if (!form.password || form.password.length < 6) {
    errors.password = "Informe sua senha corretamente.";
  }

  return errors;
}

export default function Auth() {
  const navigate = useNavigate();
  const location = useLocation();

  const [mode, setMode] = useState("login");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const [loginForm, setLoginForm] = useState(initialLoginForm);
  const [registerForm, setRegisterForm] = useState(initialRegisterForm);

  const [loginTouched, setLoginTouched] = useState({
    email: false,
    password: false,
  });

  const [registerTouched, setRegisterTouched] = useState(initialTouched);

  const redirectTo = location.state?.from || "/menu";

  const loginErrors = useMemo(() => validateLoginForm(loginForm), [loginForm]);
  const registerErrors = useMemo(() => validateRegisterForm(registerForm), [registerForm]);

  const isLoginValid = Object.keys(loginErrors).length === 0;
  const isRegisterValid = Object.keys(registerErrors).length === 0;

  useEffect(() => {
    let active = true;

    async function checkSession() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session && active) {
        navigate(redirectTo, { replace: true });
      }
    }

    checkSession();

    return () => {
      active = false;
    };
  }, [navigate, redirectTo]);

  async function fetchAddressByCep(rawCep) {
    const cep = onlyDigits(rawCep);

    if (cep.length !== 8) return;

    try {
      const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      const data = await response.json();

      if (data.erro) {
        setMessage("CEP não encontrado.");
        return;
      }

      setRegisterForm((prev) => ({
        ...prev,
        cep: formatCep(cep),
        address: data.logradouro || prev.address,
        district: data.bairro || prev.district,
        city: data.localidade || prev.city,
        state: data.uf || prev.state,
      }));
    } catch (error) {
      console.error(error);
      setMessage("Não foi possível buscar o CEP.");
    }
  }

  function handleModeChange(nextMode) {
    setMode(nextMode);
    setMessage("");
  }

  function handleRegisterChange(e) {
    const { name, value } = e.target;
    let nextValue = value;

    if (name === "cep") {
      nextValue = formatCep(value);
    }

    if (name === "phone") {
      nextValue = formatPhone(value);
    }

    if (name === "state") {
      nextValue = value.replace(/[^a-zA-Z]/g, "").slice(0, 2).toUpperCase();
    }

    setRegisterForm((prev) => ({
      ...prev,
      [name]: nextValue,
    }));

    if (name === "cep") {
      const cepDigits = onlyDigits(value);
      if (cepDigits.length === 8) {
        fetchAddressByCep(cepDigits);
      }
    }
  }

  function handleRegisterBlur(e) {
    const { name } = e.target;
    setRegisterTouched((prev) => ({
      ...prev,
      [name]: true,
    }));
  }

  function handleLoginChange(e) {
    const { name, value } = e.target;
    setLoginForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  function handleLoginBlur(e) {
    const { name } = e.target;
    setLoginTouched((prev) => ({
      ...prev,
      [name]: true,
    }));
  }

  async function handleRegister(e) {
    e.preventDefault();
    setMessage("");
    setRegisterTouched({
      name: true,
      phone: true,
      cep: true,
      address: true,
      district: true,
      city: true,
      state: true,
      number: true,
      email: true,
      password: true,
    });

    const errors = validateRegisterForm(registerForm);
    if (Object.keys(errors).length > 0) {
      setMessage("Revise os campos obrigatórios antes de continuar.");
      return;
    }

    setLoading(true);

    try {
      const cleanedForm = {
        ...registerForm,
        name: normalizeSpaces(registerForm.name),
        phone: formatPhone(registerForm.phone),
        cep: formatCep(registerForm.cep),
        address: normalizeSpaces(registerForm.address),
        district: normalizeSpaces(registerForm.district),
        city: normalizeSpaces(registerForm.city),
        state: registerForm.state.trim().toUpperCase(),
        number: normalizeSpaces(registerForm.number),
        complement: normalizeSpaces(registerForm.complement),
        reference: normalizeSpaces(registerForm.reference),
        email: registerForm.email.trim().toLowerCase(),
      };

      const { error } = await supabase.auth.signUp({
        email: cleanedForm.email,
        password: cleanedForm.password,
        options: {
          data: {
            name: cleanedForm.name,
            phone: cleanedForm.phone,
            cep: cleanedForm.cep,
            address: cleanedForm.address,
            district: cleanedForm.district,
            city: cleanedForm.city,
            state: cleanedForm.state,
            number: cleanedForm.number,
            complement: cleanedForm.complement,
            reference: cleanedForm.reference,
          },
        },
      });

      if (error) throw error;

      setMessage("Conta criada com sucesso. Faça login para continuar.");
      setMode("login");
      setLoginForm((prev) => ({
        ...prev,
        email: cleanedForm.email,
        password: "",
      }));
      setRegisterForm(initialRegisterForm);
      setRegisterTouched(initialTouched);
    } catch (error) {
      setMessage(error.message || "Não foi possível criar a conta.");
    } finally {
      setLoading(false);
    }
  }

  async function handleLogin(e) {
    e.preventDefault();
    setMessage("");
    setLoginTouched({
      email: true,
      password: true,
    });

    const errors = validateLoginForm(loginForm);
    if (Object.keys(errors).length > 0) {
      setMessage("Preencha e-mail e senha corretamente.");
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: loginForm.email.trim().toLowerCase(),
        password: loginForm.password,
      });

      if (error) throw error;

      navigate(redirectTo, { replace: true });
    } catch (error) {
      setMessage(error.message || "Não foi possível entrar.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className={styles.page}>
      <section className={styles.topBar}>
        <div className={styles.container}>
          <Link to={redirectTo} className={styles.backBtn}>
            ← Voltar
          </Link>
        </div>
      </section>

      <section className={styles.hero}>
        <div className={styles.container}>
          <span className={styles.kicker}>Conta</span>
          <h1 className={styles.title}>Entre ou crie sua conta</h1>
          <p className={styles.subtitle}>
            Salve seu endereço, acompanhe seus pedidos e agilize suas próximas compras.
          </p>
        </div>
      </section>

      <section className={styles.content}>
        <div className={styles.authCard}>
          <div className={styles.tabs}>
            <button
              type="button"
              className={`${styles.tabBtn} ${mode === "login" ? styles.tabActive : ""}`}
              onClick={() => handleModeChange("login")}
            >
              Entrar
            </button>

            <button
              type="button"
              className={`${styles.tabBtn} ${mode === "register" ? styles.tabActive : ""}`}
              onClick={() => handleModeChange("register")}
            >
              Criar conta
            </button>
          </div>

          {message ? (
            <p className={styles.message} role="alert">
              {message}
            </p>
          ) : null}

          {mode === "login" ? (
            <form className={styles.form} onSubmit={handleLogin} noValidate>
              <label className={styles.field}>
                <span>E-mail</span>
                <input
                  type="email"
                  name="email"
                  value={loginForm.email}
                  onChange={handleLoginChange}
                  onBlur={handleLoginBlur}
                  placeholder="exemplo@gmail.com"
                  autoComplete="email"
                  required
                  aria-invalid={loginTouched.email && !!loginErrors.email}
                />
                {loginTouched.email && loginErrors.email ? (
                  <small className={styles.errorText}>{loginErrors.email}</small>
                ) : null}
              </label>

              <label className={styles.field}>
                <span>Senha</span>
                <input
                  type="password"
                  name="password"
                  value={loginForm.password}
                  onChange={handleLoginChange}
                  onBlur={handleLoginBlur}
                  placeholder="Digite sua senha"
                  autoComplete="current-password"
                  required
                  minLength={6}
                  aria-invalid={loginTouched.password && !!loginErrors.password}
                />
                {loginTouched.password && loginErrors.password ? (
                  <small className={styles.errorText}>{loginErrors.password}</small>
                ) : null}
              </label>

              <Button type="submit" variant="primary" size="md" disabled={loading || !isLoginValid}>
                {loading ? "Entrando..." : "Entrar"}
              </Button>
            </form>
          ) : (
            <form className={styles.form} onSubmit={handleRegister} noValidate>
              <div className={styles.formGrid}>
                <label className={styles.field}>
                  <span>Nome</span>
                  <input
                    type="text"
                    name="name"
                    value={registerForm.name}
                    onChange={handleRegisterChange}
                    onBlur={handleRegisterBlur}
                    placeholder="Seu nome completo"
                    autoComplete="name"
                    required
                    minLength={3}
                    aria-invalid={registerTouched.name && !!registerErrors.name}
                  />
                  {registerTouched.name && registerErrors.name ? (
                    <small className={styles.errorText}>{registerErrors.name}</small>
                  ) : null}
                </label>

                <label className={styles.field}>
                  <span>Telefone</span>
                  <input
                    type="tel"
                    name="phone"
                    value={registerForm.phone}
                    onChange={handleRegisterChange}
                    onBlur={handleRegisterBlur}
                    placeholder="(61) 99999-9999"
                    autoComplete="tel"
                    required
                    aria-invalid={registerTouched.phone && !!registerErrors.phone}
                  />
                  {registerTouched.phone && registerErrors.phone ? (
                    <small className={styles.errorText}>{registerErrors.phone}</small>
                  ) : null}
                </label>

                <label className={styles.field}>
                  <span>CEP</span>
                  <input
                    type="text"
                    name="cep"
                    value={registerForm.cep}
                    onChange={handleRegisterChange}
                    onBlur={handleRegisterBlur}
                    placeholder="00000-000"
                    autoComplete="postal-code"
                    aria-invalid={registerTouched.cep && !!registerErrors.cep}
                  />
                  {registerTouched.cep && registerErrors.cep ? (
                    <small className={styles.errorText}>{registerErrors.cep}</small>
                  ) : null}
                </label>

                <label className={styles.field}>
                  <span>Endereço</span>
                  <input
                    type="text"
                    name="address"
                    value={registerForm.address}
                    onChange={handleRegisterChange}
                    onBlur={handleRegisterBlur}
                    placeholder="Rua, avenida..."
                    autoComplete="address-line1"
                    required
                    aria-invalid={registerTouched.address && !!registerErrors.address}
                  />
                  {registerTouched.address && registerErrors.address ? (
                    <small className={styles.errorText}>{registerErrors.address}</small>
                  ) : null}
                </label>

                <label className={styles.field}>
                  <span>Bairro</span>
                  <input
                    type="text"
                    name="district"
                    value={registerForm.district}
                    onChange={handleRegisterChange}
                    onBlur={handleRegisterBlur}
                    placeholder="Seu bairro"
                    required
                    aria-invalid={registerTouched.district && !!registerErrors.district}
                  />
                  {registerTouched.district && registerErrors.district ? (
                    <small className={styles.errorText}>{registerErrors.district}</small>
                  ) : null}
                </label>

                <label className={styles.field}>
                  <span>Cidade</span>
                  <input
                    type="text"
                    name="city"
                    value={registerForm.city}
                    onChange={handleRegisterChange}
                    onBlur={handleRegisterBlur}
                    placeholder="Sua cidade"
                    autoComplete="address-level2"
                    required
                    aria-invalid={registerTouched.city && !!registerErrors.city}
                  />
                  {registerTouched.city && registerErrors.city ? (
                    <small className={styles.errorText}>{registerErrors.city}</small>
                  ) : null}
                </label>

                <label className={styles.field}>
                  <span>Estado</span>
                  <input
                    type="text"
                    name="state"
                    value={registerForm.state}
                    onChange={handleRegisterChange}
                    onBlur={handleRegisterBlur}
                    placeholder="DF"
                    autoComplete="address-level1"
                    required
                    maxLength={2}
                    aria-invalid={registerTouched.state && !!registerErrors.state}
                  />
                  {registerTouched.state && registerErrors.state ? (
                    <small className={styles.errorText}>{registerErrors.state}</small>
                  ) : null}
                </label>

                <label className={styles.field}>
                  <span>Número</span>
                  <input
                    type="text"
                    name="number"
                    value={registerForm.number}
                    onChange={handleRegisterChange}
                    onBlur={handleRegisterBlur}
                    placeholder="123"
                    autoComplete="address-line2"
                    required
                    aria-invalid={registerTouched.number && !!registerErrors.number}
                  />
                  {registerTouched.number && registerErrors.number ? (
                    <small className={styles.errorText}>{registerErrors.number}</small>
                  ) : null}
                </label>

                <label className={styles.field}>
                  <span>Complemento</span>
                  <input
                    type="text"
                    name="complement"
                    value={registerForm.complement}
                    onChange={handleRegisterChange}
                    placeholder="Casa, apto, bloco..."
                    autoComplete="off"
                  />
                </label>

                <label className={styles.field}>
                  <span>Referência</span>
                  <input
                    type="text"
                    name="reference"
                    value={registerForm.reference}
                    onChange={handleRegisterChange}
                    placeholder="Próximo ao mercado, portão azul..."
                    autoComplete="off"
                  />
                </label>

                <label className={styles.field}>
                  <span>E-mail</span>
                  <input
                    type="email"
                    name="email"
                    value={registerForm.email}
                    onChange={handleRegisterChange}
                    onBlur={handleRegisterBlur}
                    placeholder="exemplo@gmail.com"
                    autoComplete="email"
                    required
                    aria-invalid={registerTouched.email && !!registerErrors.email}
                  />
                  {registerTouched.email && registerErrors.email ? (
                    <small className={styles.errorText}>{registerErrors.email}</small>
                  ) : null}
                </label>

                <label className={styles.field}>
                  <span>Senha</span>
                  <input
                    type="password"
                    name="password"
                    value={registerForm.password}
                    onChange={handleRegisterChange}
                    onBlur={handleRegisterBlur}
                    placeholder="Mínimo 6 caracteres"
                    autoComplete="new-password"
                    required
                    minLength={6}
                    aria-invalid={registerTouched.password && !!registerErrors.password}
                  />
                  {registerTouched.password && registerErrors.password ? (
                    <small className={styles.errorText}>{registerErrors.password}</small>
                  ) : null}
                </label>
              </div>

              <Button type="submit" variant="primary" size="md" disabled={loading || !isRegisterValid}>
                {loading ? "Criando conta..." : "Criar conta"}
              </Button>
            </form>
          )}
        </div>
      </section>
    </main>
  );
}