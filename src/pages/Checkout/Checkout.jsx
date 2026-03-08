import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Button from "../../components/ui/Button/Button";
import { supabase } from "../../lib/supabase";
import styles from "./Checkout.module.css";
import PaymentSection from "./components/Payment/PaymentSection";


const CART_STORAGE_KEY = "base-studio-pizzas-cart";
const GUEST_STORAGE_KEY = "base-studio-pizzas-guest";

function formatPrice(value) {
    if (value == null) return null;

    return new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
    }).format(value);
}

const initialDeliveryForm = {
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
    paymentMethod: "",
    needsChange: false,
    changeFor: "",
};

function mapUserMetadataToForm(metadata = {}) {
    return {
        name: metadata.name ?? "",
        phone: metadata.phone ?? "",
        cep: "",
        address: "",
        district: "",
        city: "",
        state: "",
        number: "",
        complement: "",
        reference: "",
        paymentMethod: "",
        needsChange: false,
        changeFor: "",
    };
}

function mapAddressToForm(address, base = {}) {
    return {
        ...base,
        cep: address?.cep ?? "",
        address: address?.address ?? "",
        district: address?.district ?? "",
        city: address?.city ?? "",
        state: address?.state ?? "",
        number: address?.number ?? "",
        complement: address?.complement ?? "",
        reference: address?.reference ?? "",
    };
}

function parseMoneyValue(value) {
    if (!value) return 0;
    return Number(String(value).replace(/\./g, "").replace(",", "."));
}

export default function Checkout() {
    const navigate = useNavigate();
    const [cartItems, setCartItems] = useState([]);
    const [mode, setMode] = useState(null); // null | guest | account
    const [deliveryForm, setDeliveryForm] = useState(initialDeliveryForm);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [hasSavedGuestData, setHasSavedGuestData] = useState(false);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [user, setUser] = useState(null);

    const [savedAddresses, setSavedAddresses] = useState([]);
    const [selectedAddressId, setSelectedAddressId] = useState(null);
    const [showNewAddressForm, setShowNewAddressForm] = useState(false);
    const [isSavingAddress, setIsSavingAddress] = useState(false);
    const [isDeletingAddress, setIsDeletingAddress] = useState(false);

    const [cepLoading, setCepLoading] = useState(false);
    const [message, setMessage] = useState("");

    async function loadAddresses(userId, metadata = {}) {
        try {
            const { data, error } = await supabase
                .from("addresses")
                .select("*")
                .eq("user_id", userId)
                .order("created_at", { ascending: true });

            if (error) throw error;

            const addresses = data ?? [];
            setSavedAddresses(addresses);

            if (addresses.length > 0) {
                const defaultAddress =
                    addresses.find((addr) => addr.is_default) ?? addresses[0];

                setSelectedAddressId(defaultAddress.id);
                setShowNewAddressForm(false);

                setDeliveryForm((prev) => ({
                    ...prev,
                    ...mapUserMetadataToForm(metadata),
                    ...mapAddressToForm(defaultAddress),
                    paymentMethod: prev.paymentMethod || "",
                    needsChange: prev.needsChange || false,
                    changeFor: prev.changeFor || "",
                }));
            } else {
                setSelectedAddressId(null);
                setShowNewAddressForm(true);

                setDeliveryForm((prev) => ({
                    ...prev,
                    ...mapUserMetadataToForm(metadata),
                    paymentMethod: prev.paymentMethod || "",
                    needsChange: prev.needsChange || false,
                    changeFor: prev.changeFor || "",
                }));
            }
        } catch (error) {
            console.error("Erro ao carregar endereços:", error);
            setMessage("Não foi possível carregar os endereços.");
        }
    }

    useEffect(() => {
        async function loadCheckoutData() {
            try {
                const savedCart = localStorage.getItem(CART_STORAGE_KEY);
                if (savedCart) {
                    const parsedCart = JSON.parse(savedCart);
                    if (Array.isArray(parsedCart)) {
                        setCartItems(parsedCart);
                    }
                }

                const { data, error } = await supabase.auth.getUser();

                if (error) {
                    console.error("Erro ao buscar usuário:", error);
                }

                const currentUser = data?.user ?? null;

                if (currentUser) {
                    const metadata = currentUser.user_metadata ?? {};

                    setUser(currentUser);
                    setIsLoggedIn(true);
                    setMode("account");
                    setDeliveryForm((prev) => ({
                        ...prev,
                        ...mapUserMetadataToForm(metadata),
                        paymentMethod: prev.paymentMethod || "",
                        needsChange: prev.needsChange || false,
                        changeFor: prev.changeFor || "",
                    }));

                    await loadAddresses(currentUser.id, metadata);
                    return;
                }

                const savedGuest = localStorage.getItem(GUEST_STORAGE_KEY);
                if (savedGuest) {
                    const parsedGuest = JSON.parse(savedGuest);
                    if (parsedGuest && typeof parsedGuest === "object") {
                        setDeliveryForm({
                            name: parsedGuest.name ?? "",
                            phone: parsedGuest.phone ?? "",
                            cep: parsedGuest.cep ?? "",
                            address: parsedGuest.address ?? "",
                            district: parsedGuest.district ?? "",
                            city: parsedGuest.city ?? "",
                            state: parsedGuest.state ?? "",
                            number: parsedGuest.number ?? "",
                            complement: parsedGuest.complement ?? "",
                            reference: parsedGuest.reference ?? "",
                            paymentMethod: parsedGuest.paymentMethod ?? "",
                            needsChange: parsedGuest.needsChange ?? false,
                            changeFor: parsedGuest.changeFor ?? "",
                        });
                        setMode("guest");
                        setHasSavedGuestData(true);
                    }
                }
            } catch (error) {
                console.error("Erro ao carregar checkout:", error);
            }
        }

        loadCheckoutData();
    }, []);

    const subtotal = useMemo(
        () => cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0),
        [cartItems]
    );

    const deliveryFee = cartItems.length > 0 ? 6.9 : 0;
    const total = subtotal + deliveryFee;

    function handleContinueAsGuest() {
        setMode("guest");
        setMessage("");
    }

    function handleDeliveryChange(event) {
        const { name, value, type, checked } = event.target;

        setDeliveryForm((prev) => {
            const nextValue = type === "checkbox" ? checked : value;
            const nextForm = {
                ...prev,
                [name]: nextValue,
            };

            if (name === "paymentMethod" && value !== "dinheiro") {
                nextForm.needsChange = false;
                nextForm.changeFor = "";
            }

            if (name === "needsChange" && !checked) {
                nextForm.changeFor = "";
            }

            return nextForm;
        });

        if (name === "cep") {
            const numbers = value.replace(/\D/g, "");
            if (numbers.length === 8) {
                fetchAddressByCep(numbers);
            }
        }
    }

    async function fetchAddressByCep(rawCep) {
        const cep = rawCep.replace(/\D/g, "");

        if (cep.length !== 8) return;

        setCepLoading(true);
        setMessage("");

        try {
            const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
            const data = await response.json();

            if (data.erro) {
                setMessage("CEP não encontrado.");
                return;
            }

            setDeliveryForm((prev) => ({
                ...prev,
                cep,
                address: data.logradouro || "",
                district: data.bairro || "",
                city: data.localidade || "",
                state: data.uf || "",
            }));
        } catch (error) {
            console.error("Erro ao buscar CEP:", error);
            setMessage("Não foi possível buscar o CEP.");
        } finally {
            setCepLoading(false);
        }
    }

    function handleSaveGuestData() {
        try {
            localStorage.setItem(GUEST_STORAGE_KEY, JSON.stringify(deliveryForm));
            setHasSavedGuestData(true);
        } catch (error) {
            console.error("Erro ao salvar dados do convidado:", error);
        }
    }

    async function handleSelectAddress(address) {
        if (!user) return;

        setSelectedAddressId(address.id);
        setShowNewAddressForm(false);
        setMessage("");

        const metadata = user.user_metadata ?? {};

        setDeliveryForm((prev) => ({
            ...prev,
            ...mapUserMetadataToForm(metadata),
            ...mapAddressToForm(address),
            paymentMethod: prev.paymentMethod || "",
            needsChange: prev.needsChange || false,
            changeFor: prev.changeFor || "",
        }));
    }

    async function handleStartNewAddress() {
        const metadata = user?.user_metadata ?? {};

        setShowNewAddressForm(true);
        setSelectedAddressId(null);
        setMessage("");

        setDeliveryForm((prev) => ({
            ...initialDeliveryForm,
            ...mapUserMetadataToForm(metadata),
            paymentMethod: prev.paymentMethod || "",
            needsChange: prev.needsChange || false,
            changeFor: prev.changeFor || "",
        }));
    }

    async function handleSaveNewAddress() {
        if (!user) return;

        if (!deliveryForm.address || !deliveryForm.number) {
            alert("Preencha endereço e número.");
            return;
        }

        setIsSavingAddress(true);
        setMessage("");

        try {
            const shouldBeDefault = savedAddresses.length === 0;

            const { error } = await supabase.from("addresses").insert({
                user_id: user.id,
                label: "",
                cep: deliveryForm.cep || null,
                address: deliveryForm.address,
                district: deliveryForm.district || null,
                city: deliveryForm.city || null,
                state: deliveryForm.state || null,
                number: deliveryForm.number,
                complement: deliveryForm.complement || null,
                reference: deliveryForm.reference || null,
                is_default: shouldBeDefault,
            });

            if (error) throw error;

            await loadAddresses(user.id, user.user_metadata ?? {});
            alert("Endereço salvo com sucesso.");
        } catch (error) {
            console.error("Erro ao salvar endereço:", error);
            alert("Não foi possível salvar o endereço.");
        } finally {
            setIsSavingAddress(false);
        }
    }

    async function handleDeleteAddress(addressId) {
        if (!user) return;

        const confirmed = window.confirm(
            "Tem certeza que deseja excluir este endereço?"
        );
        if (!confirmed) return;

        setIsDeletingAddress(true);
        setMessage("");

        try {
            const { error } = await supabase
                .from("addresses")
                .delete()
                .eq("id", addressId)
                .eq("user_id", user.id);

            if (error) throw error;

            const remaining = savedAddresses.filter((addr) => addr.id !== addressId);
            setSavedAddresses(remaining);

            if (selectedAddressId === addressId) {
                if (remaining.length > 0) {
                    const nextAddress =
                        remaining.find((addr) => addr.is_default) ?? remaining[0];
                    await handleSelectAddress(nextAddress);
                } else {
                    await handleStartNewAddress();
                }
            }

            alert("Endereço excluído com sucesso.");
        } catch (error) {
            console.error("Erro ao excluir endereço:", error);
            alert("Não foi possível excluir o endereço.");
        } finally {
            setIsDeletingAddress(false);
        }
    }

    function getActiveDeliveryData() {
        return deliveryForm;
    }
    const basePath = import.meta.env.BASE_URL;

    async function handleConfirmOrder() {
        if (cartItems.length === 0) {
            alert("Seu carrinho está vazio.");
            return;
        }

        if (mode === null) {
            alert("Escolha como deseja continuar.");
            return;
        }

        const activeDelivery = getActiveDeliveryData();

        if (
            !activeDelivery.name ||
            !activeDelivery.phone ||
            !activeDelivery.address ||
            !activeDelivery.number
        ) {
            alert("Preencha nome, telefone, endereço e número.");
            return;
        }

        if (!activeDelivery.paymentMethod) {
            alert("Selecione a forma de pagamento.");
            return;
        }

        if (activeDelivery.paymentMethod === "dinheiro" && activeDelivery.needsChange) {
            if (!activeDelivery.changeFor) {
                alert("Informe o valor para troco.");
                return;
            }

            const changeValue = parseMoneyValue(activeDelivery.changeFor);
            if (changeValue <= 0) {
                alert("Informe um valor de troco válido.");
                return;
            }

            if (changeValue < total) {
                alert("O valor do troco deve ser maior que o total do pedido.");
                return;
            }
        }

        setIsSubmitting(true);
        setMessage("");

        try {
            if (mode === "guest") {
                handleSaveGuestData();
            }

            const orderPayload = {
                total,
                subtotal,
                deliveryFee,
                customer: {
                    name: activeDelivery.name,
                    email: user?.email ?? "cliente@basestudiopizzas.com",
                    phone: activeDelivery.phone,
                },
                delivery: {
                    cep: activeDelivery.cep,
                    address: activeDelivery.address,
                    district: activeDelivery.district,
                    city: activeDelivery.city,
                    state: activeDelivery.state,
                    number: activeDelivery.number,
                    complement: activeDelivery.complement,
                    reference: activeDelivery.reference,
                },
                items: cartItems.map((item) => ({
                    id: item.id,
                    name: item.name,
                    quantity: item.quantity,
                    price: item.price,
                })),
            };

            if (activeDelivery.paymentMethod === "pagamento_online") {
                const { data, error } = await supabase.functions.invoke(
                    "create-checkout-session",
                    {
                        body: {
                            amount: total,
                            orderId: null,
                            customer: {
                                name: orderPayload.customer.name,
                                email: orderPayload.customer.email,
                            },
                            description: "Pedido Base Studio Pizzas",
                            successUrl: `${window.location.origin}${basePath}payment-success`,
                            cancelUrl: `${window.location.origin}${basePath}checkout`,
                            metadata: {
                                customer_name: orderPayload.customer.name,
                                customer_phone: orderPayload.customer.phone,
                                delivery_address: `${orderPayload.delivery.address}, ${orderPayload.delivery.number}`,
                            },
                        },
                    }
                );

                if (error) {
                    throw error;
                }

                if (!data?.url) {
                    throw new Error("A sessão de pagamento não retornou uma URL.");
                }

                window.location.href = data.url;
                return;
            }

            if (activeDelivery.paymentMethod === "cartao_entrega") {
                alert("Pedido confirmado com pagamento em cartão na entrega.");
                return;
            }

            if (activeDelivery.paymentMethod === "dinheiro") {
                alert("Pedido confirmado com pagamento em dinheiro.");
                return;
            }

            alert("Pedido confirmado com sucesso!");
        } catch (error) {
            console.error("Erro ao confirmar pedido:", error);
            alert(error.message || "Não foi possível confirmar o pedido.");
        } finally {
            setIsSubmitting(false);
        }
    }

    const activeDelivery = getActiveDeliveryData();

    return (
        <main className={styles.page}>
            <section className={styles.topBar}>
                <div className={styles.container}>
                    <Link to="/menu" className={styles.backBtn}>
                        ← Voltar ao cardápio
                    </Link>
                </div>
            </section>

            <section className={styles.hero}>
                <div className={styles.container}>
                    <span className={styles.kicker}>Checkout</span>
                    <h1 className={styles.title}>Finalizar pedido</h1>
                    <p className={styles.subtitle}>
                        Confira seus itens, informe os dados de entrega e confirme seu pedido.
                    </p>
                </div>
            </section>

            <section className={styles.content}>
                <div className={styles.containerGrid}>
                    <div className={styles.left}>
                        {mode === null ? (
                            <section className={styles.card}>
                                <h2 className={styles.sectionTitle}>Como deseja continuar?</h2>
                                <p className={styles.sectionDesc}>
                                    Você pode entrar em uma conta ou comprar sem cadastro. Ao comprar
                                    sem cadastro, salvaremos seus dados neste dispositivo para facilitar
                                    a próxima compra.
                                </p>

                                <div className={styles.choiceGrid}>
                                    <Link to="/auth" className={styles.choiceCard}>
                                        <span className={styles.choiceIcon}>👤</span>
                                        <strong>Entrar / criar conta</strong>
                                        <span>Use uma conta para salvar seus dados permanentemente.</span>
                                    </Link>

                                    <button
                                        type="button"
                                        className={styles.choiceCard}
                                        onClick={handleContinueAsGuest}
                                    >
                                        <span className={styles.choiceIcon}>🛍️</span>
                                        <strong>Comprar sem cadastro</strong>
                                        <span>
                                            Seus dados ficam salvos neste navegador para a próxima compra.
                                        </span>
                                    </button>
                                </div>
                            </section>
                        ) : null}

                        {mode === "account" ? (
                            <section className={styles.card}>
                                <div className={styles.sectionHeader}>
                                    <div>
                                        <h2 className={styles.sectionTitle}>Dados da conta</h2>
                                        <p className={styles.sectionDesc}>
                                            Você está logado como <strong>{user?.email}</strong>.
                                        </p>
                                    </div>

                                    <button
                                        type="button"
                                        className={styles.changeModeBtn}
                                        onClick={async () => {
                                            await supabase.auth.signOut();
                                            setUser(null);
                                            setIsLoggedIn(false);
                                            setMode(null);
                                            setSavedAddresses([]);
                                            setSelectedAddressId(null);
                                            setShowNewAddressForm(false);
                                            setDeliveryForm(initialDeliveryForm);
                                        }}
                                    >
                                        Sair
                                    </button>
                                </div>

                                {savedAddresses.length > 0 ? (
                                    <>
                                        <div className={styles.sectionHeader}>
                                            <div>
                                                <h2 className={styles.sectionTitle}>Seus endereços</h2>
                                                <p className={styles.sectionDesc}>
                                                    Escolha um endereço salvo ou adicione um novo.
                                                </p>
                                            </div>

                                            <button
                                                type="button"
                                                className={styles.changeModeBtn}
                                                onClick={handleStartNewAddress}
                                            >
                                                Adicionar novo endereço
                                            </button>
                                        </div>

                                        <div className={styles.addressList}>
                                            {savedAddresses.map((addr, index) => (
                                                <div
                                                    key={addr.id}
                                                    className={`${styles.addressCard} ${selectedAddressId === addr.id
                                                        ? styles.addressCardActive
                                                        : ""
                                                        }`}
                                                >
                                                    <p className={styles.addressCardTitle}>
                                                        <strong>
                                                            {addr.label?.trim() || `Endereço ${index + 1}`}
                                                        </strong>
                                                        {addr.is_default ? " • Principal" : ""}
                                                    </p>

                                                    <p className={styles.addressCardLine}>
                                                        {addr.address}, {addr.number}
                                                    </p>

                                                    {addr.complement ? (
                                                        <p className={styles.addressCardLine}>
                                                            Complemento: {addr.complement}
                                                        </p>
                                                    ) : null}

                                                    {addr.reference ? (
                                                        <p className={styles.addressCardLine}>
                                                            Referência: {addr.reference}
                                                        </p>
                                                    ) : null}

                                                    <p className={styles.addressCardLine}>
                                                        {addr.district ? `${addr.district} • ` : ""}
                                                        {addr.city}
                                                        {addr.state ? ` - ${addr.state}` : ""}
                                                    </p>

                                                    <div className={styles.addressActions}>
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => handleSelectAddress(addr)}
                                                        >
                                                            Usar este
                                                        </Button>

                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => handleDeleteAddress(addr.id)}
                                                            disabled={isDeletingAddress}
                                                        >
                                                            Excluir
                                                        </Button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </>
                                ) : null}

                                {showNewAddressForm || savedAddresses.length === 0 ? (
                                    <>
                                        <div className={styles.sectionHeader}>
                                            <div>
                                                <h2 className={styles.sectionTitle}>Novo endereço</h2>
                                                <p className={styles.sectionDesc}>
                                                    Preencha os dados e salve este endereço na sua conta.
                                                </p>
                                            </div>
                                        </div>

                                        <div className={styles.formGrid}>
                                            <label className={styles.field}>
                                                <span>Nome</span>
                                                <input
                                                    type="text"
                                                    name="name"
                                                    value={deliveryForm.name}
                                                    onChange={handleDeliveryChange}
                                                    placeholder="Seu nome"
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
                                                />
                                            </label>

                                            <label className={styles.field}>
                                                <span>CEP</span>
                                                <input
                                                    type="text"
                                                    name="cep"
                                                    value={deliveryForm.cep}
                                                    onChange={handleDeliveryChange}
                                                    placeholder="00000-000"
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
                                                />
                                            </label>

                                            <label className={styles.field}>
                                                <span>Número</span>
                                                <input
                                                    type="text"
                                                    name="number"
                                                    value={deliveryForm.number}
                                                    onChange={handleDeliveryChange}
                                                    placeholder="123"
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
                                                />
                                            </label>
                                        </div>

                                        <div className={styles.formActions}>
                                            <Button
                                                type="button"
                                                variant="primary"
                                                size="md"
                                                onClick={handleSaveNewAddress}
                                                disabled={isSavingAddress}
                                            >
                                                {isSavingAddress ? "Salvando..." : "Salvar endereço"}
                                            </Button>
                                        </div>
                                    </>
                                ) : null}
                            </section>
                        ) : null}

                        {mode === "guest" ? (
                            <section className={styles.card}>
                                <div className={styles.sectionHeader}>
                                    <div>
                                        <h2 className={styles.sectionTitle}>Dados de entrega</h2>
                                        <p className={styles.sectionDesc}>
                                            {hasSavedGuestData
                                                ? "Seus dados já foram encontrados e preenchidos automaticamente."
                                                : "Preencha seus dados para concluir o pedido."}
                                        </p>
                                    </div>

                                    <button
                                        type="button"
                                        className={styles.changeModeBtn}
                                        onClick={() => setMode(null)}
                                    >
                                        Alterar opção
                                    </button>
                                </div>

                                <div className={styles.formGrid}>
                                    <label className={styles.field}>
                                        <span>Nome</span>
                                        <input
                                            type="text"
                                            name="name"
                                            value={deliveryForm.name}
                                            onChange={handleDeliveryChange}
                                            placeholder="Seu nome"
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
                                        />
                                    </label>

                                    <label className={styles.field}>
                                        <span>CEP</span>
                                        <input
                                            type="text"
                                            name="cep"
                                            value={deliveryForm.cep}
                                            onChange={handleDeliveryChange}
                                            placeholder="00000-000"
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
                                        />
                                    </label>

                                    <label className={styles.field}>
                                        <span>Número</span>
                                        <input
                                            type="text"
                                            name="number"
                                            value={deliveryForm.number}
                                            onChange={handleDeliveryChange}
                                            placeholder="123"
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
                                        />
                                    </label>
                                </div>
                            </section>
                        ) : null}

                        {message ? (
                            <p className={styles.checkoutMessage}>
                                {cepLoading ? "Buscando CEP..." : message}
                            </p>
                        ) : cepLoading ? (
                            <p className={styles.checkoutMessage}>Buscando CEP...</p>
                        ) : null}
                    </div>

                    <aside className={styles.right}>
                        <section className={styles.summaryCard}>
                            <h2 className={styles.sectionTitle}>Resumo do pedido</h2>

                            {cartItems.length === 0 ? (
                                <div className={styles.emptyState}>
                                    <p>Seu carrinho está vazio.</p>
                                    <Link to="/menu" className={styles.emptyLink}>
                                        Ir para o cardápio
                                    </Link>
                                </div>
                            ) : (
                                <>
                                    <div className={styles.summaryList}>
                                        {cartItems.map((item) => (
                                            <div key={item.id} className={styles.summaryItem}>
                                                <div className={styles.summaryItemTop}>
                                                    <strong>
                                                        {item.quantity}x {item.name}
                                                    </strong>
                                                    <span>{formatPrice(item.price * item.quantity)}</span>
                                                </div>

                                                {item.removedIngredients?.length > 0 ? (
                                                    <p className={styles.summaryItemNote}>
                                                        {item.removedIngredients.join(" • ")}
                                                    </p>
                                                ) : null}

                                                {item.notes ? (
                                                    <p className={styles.summaryItemNote}>{item.notes}</p>
                                                ) : null}
                                            </div>
                                        ))}
                                    </div>

                                    <div className={styles.totalBox}>
                                        <div className={styles.totalRow}>
                                            <span>Subtotal</span>
                                            <strong>{formatPrice(subtotal)}</strong>
                                        </div>

                                        <div className={styles.totalRow}>
                                            <span>Entrega</span>
                                            <strong>{formatPrice(deliveryFee)}</strong>
                                        </div>

                                        <div className={`${styles.totalRow} ${styles.totalFinal}`}>
                                            <span>Total</span>
                                            <strong>{formatPrice(total)}</strong>
                                        </div>
                                    </div>

                                    <div className={styles.summaryDelivery}>
                                        <h3 className={styles.summaryDeliveryTitle}>Entrega</h3>

                                        <p className={styles.summaryDeliveryText}>
                                            {activeDelivery.name || "Nome não informado"}
                                        </p>

                                        <p className={styles.summaryDeliveryText}>
                                            {activeDelivery.address
                                                ? `${activeDelivery.address}, ${activeDelivery.number || "s/n"
                                                }`
                                                : "Endereço não informado"}
                                        </p>

                                        {activeDelivery.complement ? (
                                            <p className={styles.summaryDeliveryText}>
                                                Complemento: {activeDelivery.complement}
                                            </p>
                                        ) : null}

                                        {activeDelivery.reference ? (
                                            <p className={styles.summaryDeliveryText}>
                                                Referência: {activeDelivery.reference}
                                            </p>
                                        ) : null}

                                        <p className={styles.summaryDeliveryText}>
                                            {activeDelivery.district
                                                ? `${activeDelivery.district} • `
                                                : ""}
                                            {activeDelivery.city}
                                            {activeDelivery.state
                                                ? ` - ${activeDelivery.state}`
                                                : ""}
                                        </p>

                                        <PaymentSection
                                            paymentMethod={activeDelivery.paymentMethod}
                                            needsChange={activeDelivery.needsChange}
                                            changeFor={activeDelivery.changeFor}
                                            onChange={handleDeliveryChange}
                                        />
                                    </div>

                                    <Button
                                        type="button"
                                        variant="primary"
                                        size="md"
                                        onClick={handleConfirmOrder}
                                        disabled={isSubmitting}
                                        className={styles.confirmBtn}
                                    >
                                        {isSubmitting ? "Confirmando..." : "Confirmar pedido"}
                                    </Button>
                                </>
                            )}
                        </section>
                    </aside>
                </div>
            </section>
        </main>
    );
}