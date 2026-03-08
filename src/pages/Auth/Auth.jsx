import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import styles from "./Auth.module.css";
import Button from "../../components/ui/Button/Button";

const initialRegisterForm = {
    name: "",
    phone: "",
    address: "",
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

export default function Auth() {
    const navigate = useNavigate();

    const [mode, setMode] = useState("login"); // login | register
    const [loginForm, setLoginForm] = useState(initialLoginForm);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");
    const [registerForm, setRegisterForm] = useState({
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
    });


    async function fetchAddressByCep(rawCep) {
        const cep = rawCep.replace(/\D/g, "");

        if (cep.length !== 8) return;

        try {
            const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
            const data = await response.json();

            if (data.erro) {
                alert("CEP não encontrado");
                return;
            }

            setRegisterForm((prev) => ({
                ...prev,
                cep,
                address: data.logradouro || "",
                district: data.bairro || "",
                city: data.localidade || "",
                state: data.uf || "",
            }));

        } catch (error) {
            console.error(error);
        }
    }

    function handleRegisterChange(e) {
        const { name, value } = e.target;

        setRegisterForm((prev) => ({
            ...prev,
            [name]: value,
        }));

        if (name === "cep") {
            const numbers = value.replace(/\D/g, "");

            if (numbers.length === 8) {
                fetchAddressByCep(numbers);
            }
        }
    }

    function handleLoginChange(e) {
        const { name, value } = e.target;
        setLoginForm((prev) => ({ ...prev, [name]: value }));
    }

    async function handleRegister(e) {
        e.preventDefault();
        setLoading(true);
        setMessage("");

        try {
            const { error } = await supabase.auth.signUp({
                email: registerForm.email,
                password: registerForm.password,
                options: {
                    data: {
                        name: registerForm.name,
                        phone: registerForm.phone,
                        address: registerForm.address,
                        number: registerForm.number,
                        complement: registerForm.complement,
                        reference: registerForm.reference,
                    },
                },
            });

            if (error) throw error;

            setMessage("Conta criada com sucesso. Verifique seu e-mail ou faça login.");
            setMode("login");
            setRegisterForm(initialRegisterForm);
        } catch (error) {
            setMessage(error.message || "Não foi possível criar a conta.");
        } finally {
            setLoading(false);
        }
    }

    async function handleLogin(e) {
        e.preventDefault();
        setLoading(true);
        setMessage("");

        try {
            const { error } = await supabase.auth.signInWithPassword({
                email: loginForm.email,
                password: loginForm.password,
            });

            if (error) throw error;

            navigate("/checkout");
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
                    <Link to="/checkout" className={styles.backBtn}>
                        ← Voltar ao checkout
                    </Link>
                </div>
            </section>

            <section className={styles.hero}>
                <div className={styles.container}>
                    <span className={styles.kicker}>Conta</span>
                    <h1 className={styles.title}>Entre ou crie sua conta</h1>
                    <p className={styles.subtitle}>
                        Salve seu endereço e agilize seus próximos pedidos.
                    </p>
                </div>
            </section>

            <section className={styles.content}>
                <div className={styles.authCard}>
                    <div className={styles.tabs}>
                        <button
                            type="button"
                            className={`${styles.tabBtn} ${mode === "login" ? styles.tabActive : ""}`}
                            onClick={() => setMode("login")}
                        >
                            Entrar
                        </button>

                        <button
                            type="button"
                            className={`${styles.tabBtn} ${mode === "register" ? styles.tabActive : ""}`}
                            onClick={() => setMode("register")}
                        >
                            Criar conta
                        </button>
                    </div>

                    {message ? <p className={styles.message}>{message}</p> : null}

                    {mode === "login" ? (
                        <form className={styles.form} onSubmit={handleLogin}>
                            <label className={styles.field}>
                                <span>E-mail</span>
                                <input
                                    type="email"
                                    name="email"
                                    value={loginForm.email}
                                    onChange={handleLoginChange}
                                    required
                                />
                            </label>

                            <label className={styles.field}>
                                <span>Senha</span>
                                <input
                                    type="password"
                                    name="password"
                                    value={loginForm.password}
                                    onChange={handleLoginChange}
                                    required
                                />
                            </label>

                            <Button type="submit" variant="primary" size="md" disabled={loading}>
                                {loading ? "Entrando..." : "Entrar"}
                            </Button>
                        </form>
                    ) : (
                        <form className={styles.form} onSubmit={handleRegister}>
                            <div className={styles.formGrid}>
                                <label className={styles.field}>
                                    <span>Nome</span>
                                    <input
                                        type="text"
                                        name="name"
                                        value={registerForm.name}
                                        onChange={handleRegisterChange}
                                        placeholder="Seu nome"
                                        required
                                    />
                                </label>

                                <label className={styles.field}>
                                    <span>Telefone</span>
                                    <input
                                        type="tel"
                                        name="phone"
                                        value={registerForm.phone}
                                        onChange={handleRegisterChange}
                                        placeholder="(00) 90000-0000"
                                        required
                                    />
                                </label>

                                <label className={styles.field}>
                                    <span>CEP</span>
                                    <input
                                        type="text"
                                        name="cep"
                                        value={registerForm.cep}
                                        onChange={handleRegisterChange}
                                        placeholder="00000-000"
                                    />
                                </label>

                                <label className={`${styles.field}`}>
                                    <span>Endereço</span>
                                    <input
                                        type="text"
                                        name="address"
                                        value={registerForm.address}
                                        onChange={handleRegisterChange}
                                        required
                                    />
                                </label>

                                <label className={styles.field}>
                                    <span>Bairro</span>
                                    <input
                                        type="text"
                                        name="district"
                                        value={registerForm.district}
                                        onChange={handleRegisterChange}
                                        required
                                    />
                                </label>

                                <label className={styles.field}>
                                    <span>Cidade</span>
                                    <input
                                        type="text"
                                        name="city"
                                        value={registerForm.city}
                                        onChange={handleRegisterChange}
                                        required
                                    />
                                </label>

                                <label className={styles.field}>
                                    <span>Estado</span>
                                    <input
                                        type="text"
                                        name="state"
                                        value={registerForm.state}
                                        onChange={handleRegisterChange}
                                        required
                                    />
                                </label>

                                <label className={styles.field}>
                                    <span>Número</span>
                                    <input
                                        type="text"
                                        name="number"
                                        value={registerForm.number}
                                        onChange={handleRegisterChange}
                                        placeholder="123"
                                        required
                                    />
                                </label>

                                <label className={styles.field}>
                                    <span>Complemento</span>
                                    <input
                                        type="text"
                                        name="complement"
                                        value={registerForm.complement}
                                        onChange={handleRegisterChange}
                                        placeholder="Casa, apto, bloco..."
                                    />
                                </label>

                                <label className={`${styles.field}`}>
                                    <span>Referência</span>
                                    <input
                                        type="text"
                                        name="reference"
                                        value={registerForm.reference}
                                        onChange={handleRegisterChange}
                                        placeholder="Próximo ao mercado, portão azul..."
                                    />
                                </label>

                                <label className={styles.field}>
                                    <span>E-mail</span>
                                    <input
                                        type="email"
                                        name="email"
                                        value={registerForm.email}
                                        onChange={handleRegisterChange}
                                        placeholder="exemplo@gmail.com"
                                        required
                                    />
                                </label>

                                <label className={styles.field}>
                                    <span>Senha</span>
                                    <input
                                        type="password"
                                        name="password"
                                        value={registerForm.password}
                                        onChange={handleRegisterChange}
                                        placeholder="Senha"
                                        required
                                        minLength={6}
                                    />
                                </label>
                            </div>

                            <Button type="submit" variant="primary" size="md" disabled={loading}>
                                {loading ? "Criando conta..." : "Criar conta"}
                            </Button>
                        </form>
                    )}
                </div>
            </section>
        </main>
    );
}