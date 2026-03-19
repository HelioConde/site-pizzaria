import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Button from "../../components/ui/Button/Button";
import { supabase } from "../../lib/supabase";
import styles from "./Checkout.module.css";
import DeliveryLocationPicker from "../../components/maps/DeliveryLocationPicker";
import CheckoutPaymentBlock from "./components/CheckoutPaymentBlock";

const CART_STORAGE_KEY = "base-studio-pizzas-cart";
const GUEST_TEST_EMAIL = "compra@sem.cadastro.com";

const PAYMENT_METHOD = {
  CASH: "dinheiro",
  CARD_ON_DELIVERY: "cartao_entrega",
  ONLINE: "pagamento_online",
};

const PAYMENT_STATUS = {
  PENDING: "pending",
  PAID: "paid",
  DELIVERY_PAYMENT: "delivery_payment",
  CANCELLED: "cancelled",
};

const ORDER_STATUS = {
  PENDING: "pending",
  PREPARING: "preparing",
  DELIVERY: "delivery",
  DELIVERED: "delivered",
  CANCELLED: "cancelled",
};

function formatPrice(value) {
  if (value == null) return null;

  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(Number(value) || 0);
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

function normalizeDigits(value) {
  return String(value || "").replace(/\D/g, "");
}

function normalizeSpaces(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function formatCep(value) {
  const digits = normalizeDigits(value).slice(0, 8);
  if (digits.length <= 5) return digits;
  return `${digits.slice(0, 5)}-${digits.slice(5)}`;
}

function formatPhone(value) {
  const digits = normalizeDigits(value).slice(0, 11);

  if (!digits) return "";
  if (digits.length <= 2) return `(${digits}`;
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }

  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

function formatState(value) {
  return String(value || "")
    .replace(/[^a-zA-Z]/g, "")
    .slice(0, 2)
    .toUpperCase();
}

function formatChangeFor(value) {
  const cleaned = String(value || "").replace(/[^\d,]/g, "");

  if (!cleaned) return "";

  const parts = cleaned.split(",");
  const integerPart = parts[0].slice(0, 6);
  const decimalPart = parts[1] ? parts[1].slice(0, 2) : "";

  return decimalPart ? `${integerPart},${decimalPart}` : integerPart;
}

function formatAddressNumber(value) {
  return String(value || "")
    .replace(/[^0-9a-zA-Z/\-\s]/g, "")
    .slice(0, 12);
}

function parseMoneyValue(value) {
  if (!value) return 0;
  return Number(String(value).replace(/\./g, "").replace(",", "."));
}

function sanitizeCartItem(item) {
  if (!item || typeof item !== "object") return null;
  if (!item.name) return null;

  return {
    id: item.id ?? null,
    productId: item.productId ?? item.id ?? null,
    name: String(item.name || "Produto"),
    price: Number(item.price || 0),
    image: item.image || null,
    quantity: Math.max(1, Number(item.quantity || 1)),
    notes: String(item.notes || "").trim(),
    removedIngredients: Array.isArray(item.removedIngredients)
      ? item.removedIngredients.filter(Boolean)
      : [],
  };
}

function mapUserMetadataToForm(metadata = {}) {
  return {
    name: metadata.name ?? "",
    phone: formatPhone(metadata.phone ?? ""),
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
    cep: formatCep(address?.cep ?? ""),
    address: address?.address ?? "",
    district: address?.district ?? "",
    city: address?.city ?? "",
    state: formatState(address?.state ?? ""),
    number: address?.number ?? "",
    complement: address?.complement ?? "",
    reference: address?.reference ?? "",
  };
}

function buildFullAddress(activeDelivery) {
  const parts = [
    activeDelivery.address,
    activeDelivery.number,
    activeDelivery.district,
    activeDelivery.city,
    activeDelivery.state,
    "Brasil",
  ]
    .map((part) => String(part || "").trim())
    .filter(Boolean);

  return parts.join(", ");
}

function hasEnoughAddressForMap(activeDelivery) {
  return (
    normalizeDigits(activeDelivery.cep).length === 8 &&
    normalizeSpaces(activeDelivery.address) &&
    normalizeSpaces(activeDelivery.district) &&
    normalizeSpaces(activeDelivery.city) &&
    String(activeDelivery.state || "").trim().length === 2 &&
    normalizeSpaces(activeDelivery.number)
  );
}

function validateDeliveryData({
  mode,
  isLoggedIn,
  savedAddresses,
  selectedAddressId,
  showNewAddressForm,
  activeDelivery,
  total,
  paymentMethods,
  deliveryLat,
  deliveryLng,
  requireMapConfirmation = false,
  requirePayment = true,
  mapConfirmationMessage = "Confirme o ponto exato da entrega no mapa antes de confirmar o pedido.",
}) {
  if (mode === null) {
    return "Escolha como deseja continuar.";
  }

  if (!normalizeSpaces(activeDelivery.name)) {
    return "Preencha o nome.";
  }

  if (normalizeDigits(activeDelivery.phone).length < 10) {
    return "Preencha um telefone válido.";
  }

  const requiresFullAddress =
    mode === "guest" ||
    !isLoggedIn ||
    savedAddresses.length === 0 ||
    showNewAddressForm;

  if (mode === "account" && savedAddresses.length > 0 && !showNewAddressForm) {
    if (!selectedAddressId) {
      return "Selecione um endereço salvo.";
    }
  }

  if (requiresFullAddress) {
    if (normalizeDigits(activeDelivery.cep).length !== 8) {
      return "Preencha um CEP válido.";
    }

    if (!normalizeSpaces(activeDelivery.address)) {
      return "Preencha o endereço.";
    }

    if (!normalizeSpaces(activeDelivery.district)) {
      return "Preencha o bairro.";
    }

    if (!normalizeSpaces(activeDelivery.city)) {
      return "Preencha a cidade.";
    }

    if (String(activeDelivery.state || "").trim().length !== 2) {
      return "Preencha o estado com 2 letras.";
    }

    if (!normalizeSpaces(activeDelivery.number)) {
      return "Preencha o número do endereço.";
    }
  }

  if (requireMapConfirmation && hasEnoughAddressForMap(activeDelivery)) {
    if (
      deliveryLat == null ||
      deliveryLng == null ||
      Number.isNaN(Number(deliveryLat)) ||
      Number.isNaN(Number(deliveryLng))
    ) {
      return mapConfirmationMessage;
    }
  }

  if (requirePayment) {
    if (!activeDelivery.paymentMethod) {
      return "Selecione a forma de pagamento.";
    }

    if (
      activeDelivery.paymentMethod === paymentMethods.CASH &&
      activeDelivery.needsChange
    ) {
      if (!String(activeDelivery.changeFor || "").trim()) {
        return "Informe o valor para troco.";
      }

      const changeValue = parseMoneyValue(activeDelivery.changeFor);

      if (changeValue <= 0) {
        return "Informe um valor de troco válido.";
      }

      if (changeValue < total) {
        return "O valor do troco deve ser maior que o total do pedido.";
      }
    }
  }

  return null;
}

export default function Checkout() {
  const navigate = useNavigate();

  const [cartItems, setCartItems] = useState([]);
  const [mode, setMode] = useState(null);
  const [deliveryForm, setDeliveryForm] = useState(initialDeliveryForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);

  const [savedAddresses, setSavedAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [showNewAddressForm, setShowNewAddressForm] = useState(false);
  const [isSavingAddress, setIsSavingAddress] = useState(false);
  const [isDeletingAddress, setIsDeletingAddress] = useState(false);

  const [deliveryLat, setDeliveryLat] = useState(null);
  const [deliveryLng, setDeliveryLng] = useState(null);
  const [hasConfirmedMapLocation, setHasConfirmedMapLocation] = useState(false);
  const [skipMapSelection, setSkipMapSelection] = useState(false);
  const [isGeocoding, setIsGeocoding] = useState(false);

  const [cepLoading, setCepLoading] = useState(false);
  const [message, setMessage] = useState("");

  const hasInitializedGpsRef = useRef(false);
  const lastGeocodeKeyRef = useRef("");
  const geocodeAbortRef = useRef(null);

  const subtotal = useMemo(
    () =>
      cartItems.reduce(
        (acc, item) =>
          acc + Number(item.price || 0) * Number(item.quantity || 0),
        0
      ),
    [cartItems]
  );

  const deliveryFee = cartItems.length > 0 ? 6.9 : 0;
  const total = subtotal + deliveryFee;

  const estimatedDelivery = useMemo(() => {
    if (cartItems.length >= 4) return "35–45 min";
    if (cartItems.length >= 2) return "30–40 min";
    return "25–35 min";
  }, [cartItems.length]);

  const activeDelivery = deliveryForm;
  const hasAddressReadyForMap = hasEnoughAddressForMap(activeDelivery);
  const canShowMap = hasAddressReadyForMap && !skipMapSelection;

  const summaryNameText = normalizeSpaces(activeDelivery.name)
    ? activeDelivery.name
    : "Informe o endereço para continuar";

  const summaryAddressText = normalizeSpaces(activeDelivery.address)
    ? `${activeDelivery.address}, ${activeDelivery.number || "s/n"}`
    : "Preencha o endereço para calcular a entrega";

  const summaryRegionText =
    activeDelivery.district || activeDelivery.city || activeDelivery.state
      ? `${activeDelivery.district ? `${activeDelivery.district} • ` : ""}${
          activeDelivery.city || ""
        }${activeDelivery.state ? ` - ${activeDelivery.state}` : ""}`
      : "";

  const confirmValidationError = validateDeliveryData({
    mode,
    isLoggedIn,
    savedAddresses,
    selectedAddressId,
    showNewAddressForm,
    activeDelivery,
    total,
    paymentMethods: PAYMENT_METHOD,
    deliveryLat,
    deliveryLng,
    requireMapConfirmation: false,
    requirePayment: true,
  });

  useEffect(() => {
    if (hasInitializedGpsRef.current) return;
    hasInitializedGpsRef.current = true;

    if (!navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;

        setDeliveryLat((prev) => (prev == null ? lat : prev));
        setDeliveryLng((prev) => (prev == null ? lng : prev));
      },
      (error) => {
        console.log("GPS não disponível ou negado", error);
      },
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 60000,
      }
    );
  }, []);

  useEffect(() => {
    return () => {
      if (geocodeAbortRef.current) {
        geocodeAbortRef.current.abort();
        geocodeAbortRef.current = null;
      }
    };
  }, []);

  async function geocodeAddress(address, cep = "") {
    if (!address.trim()) return;

    if (geocodeAbortRef.current) {
      geocodeAbortRef.current.abort();
    }

    const controller = new AbortController();
    geocodeAbortRef.current = controller;

    setIsGeocoding(true);

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=br&q=${encodeURIComponent(
          address
        )}`,
        {
          signal: controller.signal,
          headers: {
            Accept: "application/json",
          },
        }
      );

      const data = await response.json();

      if (Array.isArray(data) && data.length > 0) {
        setDeliveryLat(Number(data[0].lat));
        setDeliveryLng(Number(data[0].lon));
        setHasConfirmedMapLocation(false);
        setMessage("");
        return;
      }

      const cepDigits = normalizeDigits(cep);

      if (cepDigits.length === 8) {
        const cepResponse = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=br&postalcode=${cepDigits}&country=Brazil`,
          {
            signal: controller.signal,
            headers: {
              Accept: "application/json",
            },
          }
        );

        const cepData = await cepResponse.json();

        if (Array.isArray(cepData) && cepData.length > 0) {
          setDeliveryLat(Number(cepData[0].lat));
          setDeliveryLng(Number(cepData[0].lon));
          setHasConfirmedMapLocation(false);
          setMessage(
            "Não localizamos automaticamente o endereço exato. Ajuste o ponto no mapa, se desejar."
          );
          return;
        }
      }

      setDeliveryLat(null);
      setDeliveryLng(null);
      setHasConfirmedMapLocation(false);
      setMessage(
        "Não localizamos automaticamente o endereço exato. Você pode continuar sem mapa."
      );
    } catch (error) {
      if (error.name === "AbortError") {
        return;
      }

      console.error("Erro ao localizar endereço:", error);
      setDeliveryLat(null);
      setDeliveryLng(null);
      setHasConfirmedMapLocation(false);
      setMessage("Não foi possível localizar o endereço automaticamente.");
    } finally {
      if (geocodeAbortRef.current === controller) {
        geocodeAbortRef.current = null;
      }
      setIsGeocoding(false);
    }
  }

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

        const hasSavedCoords =
          defaultAddress?.latitude != null && defaultAddress?.longitude != null;

        setDeliveryLat(hasSavedCoords ? Number(defaultAddress.latitude) : null);
        setDeliveryLng(hasSavedCoords ? Number(defaultAddress.longitude) : null);
        setHasConfirmedMapLocation(hasSavedCoords);
        setSkipMapSelection(false);

        const savedAddressKey = [
          normalizeDigits(defaultAddress?.cep),
          String(defaultAddress?.address || "").trim(),
          String(defaultAddress?.district || "").trim(),
          String(defaultAddress?.city || "").trim(),
          String(defaultAddress?.state || "").trim(),
          String(defaultAddress?.number || "").trim(),
        ].join("|");

        lastGeocodeKeyRef.current = savedAddressKey;
      } else {
        setSelectedAddressId(null);
        setShowNewAddressForm(true);
        setDeliveryLat(null);
        setDeliveryLng(null);
        setHasConfirmedMapLocation(false);
        setSkipMapSelection(false);
        lastGeocodeKeyRef.current = "";

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
            setCartItems(parsedCart.map(sanitizeCartItem).filter(Boolean));
          }
        }

        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (sessionError) {
          console.error("Erro ao buscar sessão:", sessionError);
        }

        const currentUser = session?.user ?? null;

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
        }
      } catch (error) {
        console.error("Erro ao carregar checkout:", error);
        setMessage("Não foi possível carregar os dados do checkout.");
      }
    }

    loadCheckoutData();
  }, []);

  useEffect(() => {
    if (!hasAddressReadyForMap) {
      setIsGeocoding(false);
      if (geocodeAbortRef.current) {
        geocodeAbortRef.current.abort();
        geocodeAbortRef.current = null;
      }
      lastGeocodeKeyRef.current = "";
      return;
    }

    if (skipMapSelection) {
      setIsGeocoding(false);
      if (geocodeAbortRef.current) {
        geocodeAbortRef.current.abort();
        geocodeAbortRef.current = null;
      }
      return;
    }

    if (!showNewAddressForm && selectedAddressId && hasConfirmedMapLocation) {
      return;
    }

    const addressKey = [
      normalizeDigits(activeDelivery.cep),
      normalizeSpaces(activeDelivery.address),
      normalizeSpaces(activeDelivery.district),
      normalizeSpaces(activeDelivery.city),
      String(activeDelivery.state || "").trim(),
      normalizeSpaces(activeDelivery.number),
    ].join("|");

    if (!addressKey || addressKey === lastGeocodeKeyRef.current) {
      return;
    }

    const timeout = setTimeout(() => {
      lastGeocodeKeyRef.current = addressKey;
      const address = buildFullAddress(activeDelivery);
      geocodeAddress(address, activeDelivery.cep);
    }, 700);

    return () => clearTimeout(timeout);
  }, [
    hasAddressReadyForMap,
    skipMapSelection,
    showNewAddressForm,
    selectedAddressId,
    hasConfirmedMapLocation,
    activeDelivery.cep,
    activeDelivery.address,
    activeDelivery.district,
    activeDelivery.city,
    activeDelivery.state,
    activeDelivery.number,
  ]);

  function handleContinueAsGuest() {
    setMode("guest");
    setMessage("");
    setDeliveryLat(null);
    setDeliveryLng(null);
    setHasConfirmedMapLocation(false);
    setSkipMapSelection(false);
    lastGeocodeKeyRef.current = "";
    setDeliveryForm((prev) => ({
      ...initialDeliveryForm,
      paymentMethod: prev.paymentMethod || "",
      needsChange: prev.needsChange || false,
      changeFor: prev.changeFor || "",
    }));
  }

  function handleDeliveryChange(event) {
    const { name, value, type, checked } = event.target;

    setDeliveryForm((prev) => {
      let nextValue = type === "checkbox" ? checked : value;

      if (type !== "checkbox") {
        if (name === "phone") nextValue = formatPhone(value);
        if (name === "cep") nextValue = formatCep(value);
        if (name === "state") nextValue = formatState(value);
        if (name === "changeFor") nextValue = formatChangeFor(value);
        if (name === "number") nextValue = formatAddressNumber(value);
      }

      const nextForm = {
        ...prev,
        [name]: nextValue,
      };

      if (name === "paymentMethod" && value !== PAYMENT_METHOD.CASH) {
        nextForm.needsChange = false;
        nextForm.changeFor = "";
      }

      if (name === "needsChange" && !checked) {
        nextForm.changeFor = "";
      }

      return nextForm;
    });

    if (
      ["cep", "address", "district", "city", "state", "number"].includes(name)
    ) {
      setHasConfirmedMapLocation(false);
      setSkipMapSelection(false);
      setMessage("");
      lastGeocodeKeyRef.current = "";
    }

    if (name === "cep") {
      const numbers = normalizeDigits(value);
      if (numbers.length === 8) {
        fetchAddressByCep(numbers);
      }
    }
  }

  async function fetchAddressByCep(rawCep) {
    const cep = normalizeDigits(rawCep);

    if (cep.length !== 8) return;

    setCepLoading(true);
    setMessage("");

    try {
      const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);

      if (!response.ok) {
        throw new Error("Falha ao consultar o CEP.");
      }

      const data = await response.json();

      if (data.erro) {
        setMessage("CEP não encontrado.");
        return;
      }

      setDeliveryForm((prev) => ({
        ...prev,
        cep: formatCep(cep),
        address: data.logradouro || "",
        district: data.bairro || "",
        city: data.localidade || "",
        state: formatState(data.uf || ""),
      }));

      setHasConfirmedMapLocation(false);
      setSkipMapSelection(false);
      lastGeocodeKeyRef.current = "";
    } catch (error) {
      console.error("Erro ao buscar CEP:", error);
      setMessage("Não foi possível buscar o CEP.");
    } finally {
      setCepLoading(false);
    }
  }

  async function handleSelectAddress(address) {
    if (!user) return;

    setSelectedAddressId(address.id);
    setShowNewAddressForm(false);
    setMessage("");
    setSkipMapSelection(false);

    const metadata = user.user_metadata ?? {};

    setDeliveryForm((prev) => ({
      ...prev,
      ...mapUserMetadataToForm(metadata),
      ...mapAddressToForm(address),
      paymentMethod: prev.paymentMethod || "",
      needsChange: prev.needsChange || false,
      changeFor: prev.changeFor || "",
    }));

    const hasSavedCoords =
      address.latitude != null && address.longitude != null;

    if (hasSavedCoords) {
      setDeliveryLat(Number(address.latitude));
      setDeliveryLng(Number(address.longitude));
      setHasConfirmedMapLocation(true);
    } else {
      setDeliveryLat(null);
      setDeliveryLng(null);
      setHasConfirmedMapLocation(false);
    }

    const selectedAddressKey = [
      normalizeDigits(address?.cep),
      String(address?.address || "").trim(),
      String(address?.district || "").trim(),
      String(address?.city || "").trim(),
      String(address?.state || "").trim(),
      String(address?.number || "").trim(),
    ].join("|");

    lastGeocodeKeyRef.current = hasSavedCoords ? selectedAddressKey : "";
  }

  async function handleStartNewAddress() {
    const metadata = user?.user_metadata ?? {};

    setShowNewAddressForm(true);
    setSelectedAddressId(null);
    setMessage("");
    setDeliveryLat(null);
    setDeliveryLng(null);
    setHasConfirmedMapLocation(false);
    setSkipMapSelection(false);
    lastGeocodeKeyRef.current = "";

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

    const validationError = validateDeliveryData({
      mode: "account",
      isLoggedIn: true,
      savedAddresses,
      selectedAddressId,
      showNewAddressForm: true,
      activeDelivery: deliveryForm,
      total,
      paymentMethods: PAYMENT_METHOD,
      deliveryLat,
      deliveryLng,
      requireMapConfirmation: false,
      requirePayment: false,
    });

    if (validationError) {
      setMessage(validationError);
      return;
    }

    setIsSavingAddress(true);
    setMessage("");

    try {
      const shouldBeDefault = savedAddresses.length === 0;

      const { error } = await supabase.from("addresses").insert({
        user_id: user.id,
        label: "",
        cep: normalizeDigits(deliveryForm.cep) || null,
        address: normalizeSpaces(deliveryForm.address),
        district: normalizeSpaces(deliveryForm.district) || null,
        city: normalizeSpaces(deliveryForm.city) || null,
        state: deliveryForm.state || null,
        number: normalizeSpaces(deliveryForm.number),
        complement: normalizeSpaces(deliveryForm.complement) || null,
        reference: normalizeSpaces(deliveryForm.reference) || null,
        latitude: hasConfirmedMapLocation ? deliveryLat : null,
        longitude: hasConfirmedMapLocation ? deliveryLng : null,
        is_default: shouldBeDefault,
      });

      if (error) throw error;

      await loadAddresses(user.id, user.user_metadata ?? {});
      setMessage("Endereço salvo com sucesso.");
    } catch (error) {
      console.error("Erro ao salvar endereço:", error);
      setMessage("Não foi possível salvar o endereço.");
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

      setMessage("Endereço excluído com sucesso.");
    } catch (error) {
      console.error("Erro ao excluir endereço:", error);
      setMessage("Não foi possível excluir o endereço.");
    } finally {
      setIsDeletingAddress(false);
    }
  }

  function getActiveDeliveryData() {
    return deliveryForm;
  }

  async function createOrderInSupabase({
    paymentMethod,
    paymentStatus,
    orderStatus,
    activeDelivery,
  }) {
    const customerEmail =
      user?.email ?? (mode === "guest" ? GUEST_TEST_EMAIL : null);

    const notes =
      activeDelivery.paymentMethod === PAYMENT_METHOD.CASH &&
      activeDelivery.needsChange &&
      activeDelivery.changeFor
        ? `Troco para: ${activeDelivery.changeFor}`
        : null;

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        user_id: user?.id ?? null,
        payment_method: paymentMethod,
        payment_status: paymentStatus,
        order_status: orderStatus,
        is_test_order: mode === "guest",
        subtotal,
        delivery_fee: deliveryFee,
        total,
        customer_name: normalizeSpaces(activeDelivery.name),
        customer_email: customerEmail,
        customer_phone: normalizeDigits(activeDelivery.phone),
        delivery_cep: normalizeDigits(activeDelivery.cep) || null,
        delivery_address: normalizeSpaces(activeDelivery.address) || null,
        delivery_district: normalizeSpaces(activeDelivery.district) || null,
        delivery_city: normalizeSpaces(activeDelivery.city) || null,
        delivery_state: activeDelivery.state || null,
        delivery_number: normalizeSpaces(activeDelivery.number) || null,
        delivery_complement: normalizeSpaces(activeDelivery.complement) || null,
        delivery_reference: normalizeSpaces(activeDelivery.reference) || null,
        delivery_lat: hasConfirmedMapLocation ? deliveryLat : null,
        delivery_lng: hasConfirmedMapLocation ? deliveryLng : null,
        notes,
      })
      .select()
      .single();

    if (orderError) {
      throw orderError;
    }

    const itemsPayload = cartItems.map((item) => ({
      order_id: order.id,
      product_id: item.productId ?? item.id ?? null,
      name: item.name,
      quantity: Number(item.quantity) || 1,
      unit_price: Number(item.price) || 0,
      notes: item.notes || null,
      removed_ingredients:
        item.removedIngredients?.length > 0 ? item.removedIngredients : null,
    }));

    const { error: itemsError } = await supabase
      .from("order_items")
      .insert(itemsPayload);

    if (itemsError) {
      throw itemsError;
    }

    return order;
  }

  function clearCartOnly() {
    localStorage.removeItem(CART_STORAGE_KEY);
    setCartItems([]);
  }

  async function handleConfirmOrder() {
    if (cartItems.length === 0) {
      setMessage("Seu carrinho está vazio.");
      return;
    }

    setIsSubmitting(true);
    setMessage("");

    try {
      const activeDelivery = getActiveDeliveryData();

      const validationError = validateDeliveryData({
        mode,
        isLoggedIn,
        savedAddresses,
        selectedAddressId,
        showNewAddressForm,
        activeDelivery,
        total,
        paymentMethods: PAYMENT_METHOD,
        deliveryLat,
        deliveryLng,
        requireMapConfirmation: false,
        requirePayment: true,
      });

      if (validationError) {
        setMessage(validationError);
        return;
      }

      const selectedAddress = savedAddresses.find(
        (addr) => String(addr.id) === String(selectedAddressId)
      );

      const shouldUpdateAddressCoords =
        selectedAddress &&
        hasConfirmedMapLocation &&
        deliveryLat != null &&
        deliveryLng != null &&
        !Number.isNaN(Number(deliveryLat)) &&
        !Number.isNaN(Number(deliveryLng)) &&
        (Number(selectedAddress.latitude) !== Number(deliveryLat) ||
          Number(selectedAddress.longitude) !== Number(deliveryLng));

      if (
        mode === "account" &&
        selectedAddressId &&
        shouldUpdateAddressCoords &&
        user?.id
      ) {
        const { error: addressUpdateError } = await supabase
          .from("addresses")
          .update({
            latitude: deliveryLat,
            longitude: deliveryLng,
          })
          .eq("id", selectedAddressId)
          .eq("user_id", user.id);

        if (addressUpdateError) {
          throw addressUpdateError;
        }
      }

      if (activeDelivery.paymentMethod === PAYMENT_METHOD.ONLINE) {
        const basePath = import.meta.env.BASE_URL || "/";
        const normalizedBasePath = basePath.endsWith("/")
          ? basePath
          : `${basePath}/`;

        const checkoutToken = `checkout_${Date.now()}_${Math.random()
          .toString(36)
          .slice(2, 10)}`;

        const payload = {
          mode,
          cartItems: cartItems.map((item) => ({
            id: item.id ?? null,
            productId: item.productId ?? item.id ?? null,
            name: item.name,
            quantity: Number(item.quantity) || 1,
            price: Number(item.price) || 0,
            notes: item.notes || null,
            removedIngredients:
              item.removedIngredients?.length > 0
                ? item.removedIngredients
                : null,
          })),
          subtotal,
          deliveryFee,
          total,
          customer: {
            name: normalizeSpaces(activeDelivery.name),
            email: user?.email ?? GUEST_TEST_EMAIL,
            phone: normalizeDigits(activeDelivery.phone),
          },
          delivery: {
            cep: normalizeDigits(activeDelivery.cep) || null,
            address: normalizeSpaces(activeDelivery.address) || null,
            district: normalizeSpaces(activeDelivery.district) || null,
            city: normalizeSpaces(activeDelivery.city) || null,
            state: activeDelivery.state || null,
            number: normalizeSpaces(activeDelivery.number) || null,
            complement: normalizeSpaces(activeDelivery.complement) || null,
            reference: normalizeSpaces(activeDelivery.reference) || null,
            lat: hasConfirmedMapLocation ? deliveryLat : null,
            lng: hasConfirmedMapLocation ? deliveryLng : null,
          },
        };

        localStorage.setItem(
          `base-studio-pizzas-checkout-${checkoutToken}`,
          JSON.stringify(payload)
        );

        const { data, error } = await supabase.functions.invoke(
          "create-checkout-session",
          {
            body: {
              ...payload,
              checkoutToken,
             successUrl: `${window.location.origin}${normalizedBasePath}payment-online-check?session_id={CHECKOUT_SESSION_ID}&checkout_token=${checkoutToken}`,
              cancelUrl: `${window.location.origin}${normalizedBasePath}checkout`,
            },
          }
        );

        if (error) throw error;

        if (!data?.url) {
          throw new Error("A sessão de pagamento não retornou uma URL.");
        }

        window.location.href = data.url;
        return;
      }

      if (activeDelivery.paymentMethod === PAYMENT_METHOD.CARD_ON_DELIVERY) {
        const order = await createOrderInSupabase({
          paymentMethod: PAYMENT_METHOD.CARD_ON_DELIVERY,
          paymentStatus: PAYMENT_STATUS.DELIVERY_PAYMENT,
          orderStatus: ORDER_STATUS.PENDING,
          activeDelivery,
        });

        clearCartOnly();
        navigate(`/payment-success?order_id=${order.id}`, { replace: true });
        return;
      }

      if (activeDelivery.paymentMethod === PAYMENT_METHOD.CASH) {
        const order = await createOrderInSupabase({
          paymentMethod: PAYMENT_METHOD.CASH,
          paymentStatus: PAYMENT_STATUS.DELIVERY_PAYMENT,
          orderStatus: ORDER_STATUS.PENDING,
          activeDelivery,
        });

        clearCartOnly();
        navigate(`/payment-success?order_id=${order.id}`, { replace: true });
        return;
      }

      setMessage("Forma de pagamento inválida.");
    } catch (error) {
      console.error("Erro ao confirmar pedido:", error);
      setMessage(error.message || "Não foi possível confirmar o pedido.");
    } finally {
      setIsSubmitting(false);
    }
  }

  function renderDeliveryFields() {
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
            Revise os dados e confirme seu pedido.
          </p>

          <div className={styles.stepper}>
            <div className={`${styles.stepItem} ${styles.stepItemActive}`}>
              <span className={styles.stepDot}>1</span>
              <span>Entrega</span>
            </div>
            <div className={styles.stepLine} />
            <div className={styles.stepItem}>
              <span className={styles.stepDot}>2</span>
              <span>Pagamento</span>
            </div>
            <div className={styles.stepLine} />
            <div className={styles.stepItem}>
              <span className={styles.stepDot}>3</span>
              <span>Confirmação</span>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.content}>
        <div className={styles.containerGrid}>
          <div className={styles.left}>
            {mode === null ? (
              <section className={styles.card}>
                <h2 className={styles.sectionTitle}>Como deseja continuar?</h2>
                <p className={styles.sectionDesc}>
                  Escolha como deseja finalizar o pedido.
                </p>

                <div className={styles.choiceGrid}>
                  <Link to="/auth" className={styles.choiceCard}>
                    <span className={styles.choiceIcon}>👤</span>
                    <strong>Entrar na conta</strong>
                    <span>
                      Use sua conta para salvar dados e acompanhar pedidos.
                    </span>
                  </Link>

                  <button
                    type="button"
                    className={styles.choiceCard}
                    onClick={handleContinueAsGuest}
                  >
                    <span className={styles.choiceIcon}>🛍️</span>
                    <strong>Continuar como convidado</strong>
                    <span>Finalize o pedido sem criar conta.</span>
                  </button>
                </div>
              </section>
            ) : null}

            {mode === "account" ? (
              <section className={styles.card}>
                <div className={styles.newAddressBlock}>
                  <div className={styles.sectionHeader}>
                    <div>
                      <h2 className={styles.sectionTitle}>Dados da conta</h2>
                      <p className={styles.sectionDesc}>
                        Conta conectada: <strong>{user?.email}</strong>
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
                        setDeliveryLat(null);
                        setDeliveryLng(null);
                        setHasConfirmedMapLocation(false);
                        setSkipMapSelection(false);
                        setDeliveryForm(initialDeliveryForm);
                        setMessage("");
                        lastGeocodeKeyRef.current = "";
                      }}
                    >
                      Trocar conta
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
                          + Novo endereço
                        </button>
                      </div>

                      <div className={styles.addressList}>
                        {savedAddresses.map((addr, index) => (
                          <div
                            key={addr.id}
                            className={`${styles.addressCard} ${
                              selectedAddressId === addr.id
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
                </div>
              </section>
            ) : null}

            {mode === "guest" ? (
              <section className={styles.card}>
                <div className={styles.sectionHeader}>
                  <div>
                    <h2 className={styles.sectionTitle}>Dados de entrega</h2>
                    <p className={styles.sectionDesc}>
                      Informe seu endereço para finalizar o pedido.
                    </p>
                  </div>

                  <button
                    type="button"
                    className={styles.changeModeBtn}
                    onClick={() => {
                      setMode(null);
                      setDeliveryLat(null);
                      setDeliveryLng(null);
                      setHasConfirmedMapLocation(false);
                      setSkipMapSelection(false);
                      setMessage("");
                      lastGeocodeKeyRef.current = "";
                    }}
                  >
                    Usar conta
                  </button>
                </div>

                {renderDeliveryFields()}
              </section>
            ) : null}

            {mode === "account" &&
            (showNewAddressForm || savedAddresses.length === 0) ? (
              <section className={styles.card}>
                <div>
                  <span className={styles.formBadge}>Novo endereço</span>
                  <h2 className={styles.sectionTitle}>Salvar endereço</h2>
                  <p className={styles.sectionDesc}>
                    Preencha os dados e use este endereço na conta.
                  </p>
                </div>

                {renderDeliveryFields()}

                <div className={styles.formActions}>
                  <Button
                    type="button"
                    variant="primary"
                    size="md"
                    onClick={handleSaveNewAddress}
                    disabled={isSavingAddress}
                  >
                    {isSavingAddress ? "Salvando..." : "Salvar e usar endereço"}
                  </Button>
                </div>
              </section>
            ) : null}

            {cepLoading ? (
              <p className={styles.checkoutMessage}>Buscando CEP...</p>
            ) : isGeocoding && canShowMap ? (
              <p className={styles.checkoutMessage}>
                Localizando endereço no mapa...
              </p>
            ) : null}

            {message ? (
              <p className={styles.checkoutMessage} role="alert">
                {message}
              </p>
            ) : null}

            <section className={styles.helpCard}>
              <h3 className={styles.helpTitle}>Precisa de ajuda?</h3>
              <p className={styles.helpText}>
                Revise os dados com calma. Seu carrinho continua salvo mesmo se
                você voltar ao cardápio.
              </p>
              <p className={styles.helpText}>
                O pedido só é concluído depois da confirmação de pagamento ou da
                finalização da compra.
              </p>
            </section>
          </div>

          <aside className={styles.right}>
            <section className={styles.summaryCard}>
              <div className={styles.summaryHeader}>
                <h2 className={styles.sectionTitle}>Resumo do pedido</h2>

                <div className={styles.summaryPills}>
                  <div className={styles.summaryPill}>
                    <span>🕒 Entrega estimada</span>
                    <strong>{estimatedDelivery}</strong>
                  </div>

                  <div className={styles.summaryPillSafe}>
                    🔒 Checkout seguro
                  </div>
                </div>
              </div>

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
                    {cartItems.map((item, index) => (
                      <div
                        key={`${item.id ?? item.productId ?? item.name}-${index}`}
                        className={styles.summaryItem}
                      >
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
                      <span>Total a pagar</span>
                      <strong>{formatPrice(total)}</strong>
                    </div>
                  </div>

                  <div className={styles.summaryDelivery}>
                    <h3 className={styles.summaryDeliveryTitle}>Entrega</h3>

                    <p className={styles.summaryDeliveryText}>
                      {summaryNameText}
                    </p>
                    <p className={styles.summaryDeliveryText}>
                      {summaryAddressText}
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

                    {summaryRegionText ? (
                      <p className={styles.summaryDeliveryText}>
                        {summaryRegionText}
                      </p>
                    ) : null}

                    <CheckoutPaymentBlock
                      hasAddressReadyForMap={hasAddressReadyForMap}
                      skipMapSelection={skipMapSelection}
                      setSkipMapSelection={setSkipMapSelection}
                      setDeliveryLat={setDeliveryLat}
                      setDeliveryLng={setDeliveryLng}
                      setHasConfirmedMapLocation={setHasConfirmedMapLocation}
                      setMessage={setMessage}
                      setIsGeocoding={setIsGeocoding}
                      lastGeocodeKeyRef={lastGeocodeKeyRef}
                      deliveryLat={deliveryLat}
                      deliveryLng={deliveryLng}
                      DeliveryLocationPicker={DeliveryLocationPicker}
                      hasConfirmedMapLocation={hasConfirmedMapLocation}
                      activeDelivery={activeDelivery}
                      handleDeliveryChange={handleDeliveryChange}
                      PAYMENT_METHOD={PAYMENT_METHOD}
                      isSubmitting={isSubmitting}
                      handleConfirmOrder={handleConfirmOrder}
                      confirmValidationError={confirmValidationError}
                    />
                  </div>
                </>
              )}
            </section>
          </aside>
        </div>
      </section>
    </main>
  );
}