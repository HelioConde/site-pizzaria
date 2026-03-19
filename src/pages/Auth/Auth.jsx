import { useEffect, useMemo, useRef, useState } from "react";
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
  logAuthError,
  mapAuthErrorMessage,
} from "./auth.service";

async function ensureInitialAddress(userId, formData) {
  const normalizedAddress = normalizeSpaces(formData.address);
  const normalizedDistrict = normalizeSpaces(formData.district);
  const normalizedCity = normalizeSpaces(formData.city);
  const normalizedState = String(formData.state || "").trim().toUpperCase();
  const normalizedNumber = normalizeSpaces(formData.number);
  const normalizedComplement = normalizeSpaces(formData.complement);
  const normalizedReference = normalizeSpaces(formData.reference);
  const normalizedCep = onlyDigits(formData.cep);

  if (
    !normalizedAddress ||
    !normalizedNumber ||
    !normalizedCity ||
    !normalizedState
  ) {
    return;
  }

  const { data: existingAddresses, error: existingError } = await supabase
    .from("addresses")
    .select(
      "id, cep, address, district, city, state, number, complement, reference, is_default"
    )
    .eq("user_id", userId);

  if (existingError) {
    throw existingError;
  }

  const foundSameAddress = (existingAddresses ?? []).find((addr) => {
    return (
      onlyDigits(addr.cep) === normalizedCep &&
      normalizeSpaces(addr.address) === normalizedAddress &&
      normalizeSpaces(addr.district) === normalizedDistrict &&
      normalizeSpaces(addr.city) === normalizedCity &&
      String(addr.state || "").trim().toUpperCase() === normalizedState &&
      normalizeSpaces(addr.number) === normalizedNumber &&
      normalizeSpaces(addr.complement) === normalizedComplement &&
      normalizeSpaces(addr.reference) === normalizedReference
    );
  });

  if (foundSameAddress) {
    return;
  }

  const shouldBeDefault = (existingAddresses ?? []).length === 0;

  const { error: insertError } = await supabase.from("addresses").insert({
    user_id: userId,
    label: "Endereço principal",
    cep: normalizedCep ? formatCep(normalizedCep) : null,
    address: normalizedAddress,
    district: normalizedDistrict || null,
    city: normalizedCity || null,
    state: normalizedState || null,
    number: normalizedNumber,
    complement: normalizedComplement || null,
    reference: normalizedReference || null,
    is_default: shouldBeDefault,
  });

  if (insertError) {
    throw insertError;
  }
}

function sanitizeRedirectPath(fromState) {
  if (typeof fromState !== "string") return "/menu";
  if (!fromState.startsWith("/")) return "/menu";
  return fromState;
}

export default function Auth() {
  const navigate = useNavigate();
  const location = useLocation();
  const cepRequestIdRef = useRef(0);

  const [mode, setMode] = useState("login");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const [loginForm, setLoginForm] = useState(initialLoginForm);
  const [registerForm, setRegisterForm] = useState(initialRegisterForm);

  const [loginTouched, setLoginTouched] = useState(initialLoginTouched);
  const [registerTouched, setRegisterTouched] = useState(
    initialRegisterTouched
  );

  const redirectTo = sanitizeRedirectPath(location.state?.from);

  const loginErrors = useMemo(() => validateLoginForm(loginForm), [loginForm]);
  const registerErrors = useMemo(
    () => validateRegisterForm(registerForm),
    [registerForm]
  );

  const isLoginValid = Object.keys(loginErrors).length === 0;
  const isRegisterValid = Object.keys(registerErrors).length === 0;

  useEffect(() => {
    if (location.state?.successMessage) {
      setMessage(location.state.successMessage);
    }
  }, [location.state]);

  useEffect(() => {
    let isMounted = true;

    async function checkSession() {
      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        if (error) {
          throw error;
        }

        if (!session || !isMounted) return;

        const role = await getProfileRole(session.user.id);
        const redirectPath = getRedirectByRole(role, redirectTo);

        if (isMounted) {
          navigate(redirectPath, { replace: true });
        }
      } catch (error) {
        logAuthError("Erro ao verificar sessão", error, {
          origem: "checkSession",
        });
      }
    }

    checkSession();

    return () => {
      isMounted = false;
    };
  }, [navigate, redirectTo]);

  async function handleFetchAddressByCep(rawCep) {
    const requestId = ++cepRequestIdRef.current;

    try {
      const data = await fetchAddressByCep(rawCep);

      if (!data || requestId !== cepRequestIdRef.current) return;

      setRegisterForm((prev) => ({
        ...prev,
        cep: formatCep(rawCep),
        address: data.logradouro || prev.address,
        district: data.bairro || prev.district,
        city: data.localidade || prev.city,
        state: data.uf || prev.state,
      }));
    } catch (error) {
      if (requestId !== cepRequestIdRef.current) return;

      logAuthError("Erro ao buscar CEP", error, {
        cep: rawCep,
      });

      setMessage(
        mapAuthErrorMessage(
          error,
          error?.message || "Não foi possível buscar o CEP."
        )
      );
    }
  }

  function handleModeChange(nextMode) {
    setMode(nextMode);
    setMessage("");
  }

  function handleRegisterChange(event) {
    const { name, value } = event.target;
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

    if (message) {
      setMessage("");
    }

    if (name === "cep") {
      const cepDigits = onlyDigits(value);

      if (cepDigits.length === 8) {
        handleFetchAddressByCep(cepDigits);
      }
    }
  }

  function handleRegisterBlur(event) {
    const { name } = event.target;

    setRegisterTouched((prev) => ({
      ...prev,
      [name]: true,
    }));
  }

  function handleLoginChange(event) {
    const { name, value } = event.target;

    setLoginForm((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (message) {
      setMessage("");
    }
  }

  function handleLoginBlur(event) {
    const { name } = event.target;

    setLoginTouched((prev) => ({
      ...prev,
      [name]: true,
    }));
  }

  async function handleRegister(event) {
    event.preventDefault();
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
      confirmPassword: true,
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

      const hasSession = !!data?.session;
      const createdUserId = data?.user?.id;

      if (createdUserId && hasSession) {
        await ensureInitialAddress(createdUserId, cleanedForm);

        const role = await getProfileRole(createdUserId).catch(
          () => USER_ROLE.CUSTOMER
        );
        const redirectPath = getRedirectByRole(role, redirectTo);

        navigate(redirectPath, {
          replace: true,
          state: {
            successMessage: "Conta criada com sucesso. Você já está logado.",
          },
        });
        return;
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
      logAuthError("Erro ao criar conta", error, {
        email: registerForm.email,
        modo: "cadastro",
      });

      setMessage(
        mapAuthErrorMessage(
          error,
          "Não foi possível criar a conta no momento."
        )
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleLogin(event) {
    event.preventDefault();
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

      navigate(redirectPath, { replace: true });
    } catch (error) {
      logAuthError("Erro no login", error, {
        email: loginForm.email,
        modo: "login",
      });

      setMessage(
        mapAuthErrorMessage(error, "Não foi possível entrar no momento.")
      );
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
              className={`${styles.tabBtn} ${mode === "login" ? styles.tabActive : ""
                }`}
              onClick={() => handleModeChange("login")}
            >
              Entrar
            </button>

            <button
              type="button"
              className={`${styles.tabBtn} ${mode === "register" ? styles.tabActive : ""
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