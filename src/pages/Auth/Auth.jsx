import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import styles from "./Auth.module.css";

import LoginForm from "./components/LoginForm";
import RegisterForm from "./components/RegisterForm";

import {
  USER_ROLE,
  initialLoginForm,
  initialRegisterForm,
  initialLoginTouched,
  initialRegisterTouched,
} from "./auth.constants";

import {
  normalizeSpaces,
  onlyDigits,
  formatCep,
  formatPhone,
  validateLoginForm,
  validateRegisterForm,
} from "./auth.utils";

import {
  fetchAddressByCep,
  getProfileRole,
  getRedirectByRole,
} from "./auth.service";

export default function Auth() {
  const navigate = useNavigate();
  const location = useLocation();

  const [mode, setMode] = useState("login");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const [loginForm, setLoginForm] = useState(initialLoginForm);
  const [registerForm, setRegisterForm] = useState(initialRegisterForm);

  const [loginTouched, setLoginTouched] = useState(initialLoginTouched);
  const [registerTouched, setRegisterTouched] = useState(initialRegisterTouched);

  const redirectTo = location.state?.from || "/menu";

  const loginErrors = useMemo(() => validateLoginForm(loginForm), [loginForm]);
  const registerErrors = useMemo(
    () => validateRegisterForm(registerForm),
    [registerForm]
  );

  const isLoginValid = Object.keys(loginErrors).length === 0;
  const isRegisterValid = Object.keys(registerErrors).length === 0;

  useEffect(() => {
    let active = true;

    async function checkSession() {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session || !active) return;

        const role = await getProfileRole(session.user.id);
        const redirectPath = getRedirectByRole(role, redirectTo);

        console.log("checkSession role:", role);
        console.log("checkSession redirectPath:", redirectPath);

        if (active) {
          navigate(redirectPath, { replace: true });
        }
      } catch (error) {
        console.error("Erro ao verificar sessão:", error);
      }
    }

    checkSession();

    return () => {
      active = false;
    };
  }, [navigate, redirectTo]);

  async function handleFetchAddressByCep(rawCep) {
    try {
      const data = await fetchAddressByCep(rawCep);

      if (!data) return;

      setRegisterForm((prev) => ({
        ...prev,
        cep: formatCep(rawCep),
        address: data.logradouro || prev.address,
        district: data.bairro || prev.district,
        city: data.localidade || prev.city,
        state: data.uf || prev.state,
      }));
    } catch (error) {
      console.error(error);
      setMessage(error.message || "Não foi possível buscar o CEP.");
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
        handleFetchAddressByCep(cepDigits);
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
        state: String(registerForm.state || "").trim().toUpperCase(),
        number: normalizeSpaces(registerForm.number),
        complement: normalizeSpaces(registerForm.complement),
        reference: normalizeSpaces(registerForm.reference),
        email: String(registerForm.email || "").trim().toLowerCase(),
      };

      const { data, error } = await supabase.auth.signUp({
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

      const createdUserId = data?.user?.id;

      if (createdUserId) {
        const { error: profileError } = await supabase.from("profiles").upsert({
          id: createdUserId,
          name: cleanedForm.name,
          role: USER_ROLE.CUSTOMER,
        });

        if (profileError) {
          throw profileError;
        }
      }

      setMessage("Conta criada com sucesso. Faça login para continuar.");
      setMode("login");
      setLoginForm((prev) => ({
        ...prev,
        email: cleanedForm.email,
        password: "",
      }));
      setRegisterForm(initialRegisterForm);
      setRegisterTouched(initialRegisterTouched);
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
      const { data, error } = await supabase.auth.signInWithPassword({
        email: loginForm.email.trim().toLowerCase(),
        password: loginForm.password,
      });

      if (error) throw error;

      const userId = data?.user?.id;

      if (!userId) {
        throw new Error("Não foi possível identificar o usuário logado.");
      }

      const role = await getProfileRole(userId);
      const redirectPath = getRedirectByRole(role, redirectTo);

      console.log("handleLogin role:", role);
      console.log("handleLogin redirectPath:", redirectPath);

      navigate(redirectPath, { replace: true });
    } catch (error) {
      console.error("Erro no login:", error);
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
            Salve seu endereço, acompanhe seus pedidos e agilize suas próximas
            compras.
          </p>
        </div>
      </section>

      <section className={styles.content}>
        <div className={styles.authCard}>
          <div className={styles.tabs}>
            <button
              type="button"
              className={`${styles.tabBtn} ${
                mode === "login" ? styles.tabActive : ""
              }`}
              onClick={() => handleModeChange("login")}
            >
              Entrar
            </button>

            <button
              type="button"
              className={`${styles.tabBtn} ${
                mode === "register" ? styles.tabActive : ""
              }`}
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
            <LoginForm
              form={loginForm}
              touched={loginTouched}
              errors={loginErrors}
              loading={loading}
              isValid={isLoginValid}
              onChange={handleLoginChange}
              onBlur={handleLoginBlur}
              onSubmit={handleLogin}
            />
          ) : (
            <RegisterForm
              form={registerForm}
              touched={registerTouched}
              errors={registerErrors}
              loading={loading}
              isValid={isRegisterValid}
              onChange={handleRegisterChange}
              onBlur={handleRegisterBlur}
              onSubmit={handleRegister}
            />
          )}
        </div>
      </section>
    </main>
  );
}