import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../../lib/supabase";

import {
  CART_STORAGE_KEY,
  GUEST_TEST_EMAIL,
  PAYMENT_METHOD,
  PAYMENT_STATUS,
  ORDER_STATUS,
  initialDeliveryForm,
} from "../checkout.constants";

import {
  sanitizeCartItem,
  normalizeDeliveryFee,
  normalizeDigits,
  normalizeSpaces,
  formatCep,
  formatPhone,
  formatState,
  formatChangeFor,
  formatAddressNumber,
  mapUserMetadataToForm,
  mapAddressToForm,
  hasEnoughAddressForMap,
  validateDeliveryData,
} from "../checkout.utils";

export default function useCheckout() {
  const navigate = useNavigate();

  const [cartItems, setCartItems] = useState([]);
  const [storeSettings, setStoreSettings] = useState(null);
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

  const subtotal = useMemo(() => {
    return cartItems.reduce(
      (acc, item) =>
        acc + Number(item.price || 0) * Number(item.quantity || 0),
      0
    );
  }, [cartItems]);

  const configuredDeliveryFee = useMemo(() => {
    return normalizeDeliveryFee(storeSettings?.delivery_fee);
  }, [storeSettings]);

  const deliveryFee = cartItems.length > 0 ? configuredDeliveryFee : 0;
  const total = subtotal + deliveryFee;

  const estimatedDelivery = useMemo(() => {
    const configuredValue = normalizeSpaces(
      storeSettings?.estimated_delivery_time
    );

    if (configuredValue) return configuredValue;
    if (cartItems.length >= 4) return "35–45 min";
    if (cartItems.length >= 2) return "30–40 min";
    return "25–35 min";
  }, [cartItems.length, storeSettings]);

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

  async function loadStoreSettings() {
    try {
      const { data, error } = await supabase
        .from("store_settings")
        .select("delivery_fee, estimated_delivery_time")
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      setStoreSettings(data ?? null);
    } catch (error) {
      console.error("Erro ao carregar configurações da loja:", error);
      setStoreSettings(null);
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

        const savedLat = defaultAddress?.latitude ?? defaultAddress?.lat ?? null;
        const savedLng =
          defaultAddress?.longitude ?? defaultAddress?.lng ?? null;

        const hasSavedCoords = savedLat != null && savedLng != null;

        setDeliveryLat(hasSavedCoords ? Number(savedLat) : null);
        setDeliveryLng(hasSavedCoords ? Number(savedLng) : null);
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

        lastGeocodeKeyRef.current = hasSavedCoords ? savedAddressKey : "";
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

        await loadStoreSettings();

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
    const channel = supabase
      .channel("checkout-store-settings")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "store_settings",
        },
        () => {
          loadStoreSettings();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  function resetMapState() {
    setDeliveryLat(null);
    setDeliveryLng(null);
    setHasConfirmedMapLocation(false);
    setSkipMapSelection(false);
    setIsGeocoding(false);
    lastGeocodeKeyRef.current = "";
  }

  function handleContinueAsGuest() {
    setMode("guest");
    setMessage("");
    resetMapState();

    setDeliveryForm((prev) => ({
      ...initialDeliveryForm,
      paymentMethod: prev.paymentMethod || "",
      needsChange: prev.needsChange || false,
      changeFor: prev.changeFor || "",
    }));
  }

  function handleBackToModeSelection() {
    setMode(null);
    setMessage("");
    resetMapState();
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

    const savedLat = address?.latitude ?? address?.lat ?? null;
    const savedLng = address?.longitude ?? address?.lng ?? null;
    const hasSavedCoords = savedLat != null && savedLng != null;

    if (hasSavedCoords) {
      setDeliveryLat(Number(savedLat));
      setDeliveryLng(Number(savedLng));
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
    resetMapState();

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
        latitude: deliveryLat != null ? Number(deliveryLat) : null,
        longitude: deliveryLng != null ? Number(deliveryLng) : null,
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

  async function handleSignOutAndReset() {
    await supabase.auth.signOut();
    setUser(null);
    setIsLoggedIn(false);
    setMode(null);
    setSavedAddresses([]);
    setSelectedAddressId(null);
    setShowNewAddressForm(false);
    resetMapState();
    setDeliveryForm(initialDeliveryForm);
    setMessage("");
  }

  function clearCartOnly() {
    localStorage.removeItem(CART_STORAGE_KEY);
    setCartItems([]);
  }

  async function createOrderInSupabase({
    paymentMethod,
    paymentStatus,
    orderStatus,
    activeDelivery,
  }) {
    if (!Array.isArray(cartItems) || cartItems.length === 0) {
      throw new Error("Seu carrinho está vazio.");
    }

    const normalizedCartItems = cartItems
      .map(sanitizeCartItem)
      .filter(Boolean)
      .filter((item) => normalizeSpaces(item.name));

    if (normalizedCartItems.length === 0) {
      throw new Error("Não foi possível processar os itens do carrinho.");
    }

    const customerEmail =
      user?.email ?? (mode === "guest" ? GUEST_TEST_EMAIL : null);

    const notes =
      activeDelivery.paymentMethod === PAYMENT_METHOD.CASH &&
      activeDelivery.needsChange &&
      activeDelivery.changeFor
        ? `Troco para: ${activeDelivery.changeFor}`
        : null;

    let createdOrder = null;

    try {
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
          delivery_complement:
            normalizeSpaces(activeDelivery.complement) || null,
          delivery_reference: normalizeSpaces(activeDelivery.reference) || null,
          delivery_lat: deliveryLat != null ? Number(deliveryLat) : null,
          delivery_lng: deliveryLng != null ? Number(deliveryLng) : null,
          notes,
        })
        .select()
        .single();

      if (orderError) throw orderError;

      createdOrder = order;

      const itemsPayload = normalizedCartItems.map((item) => ({
        order_id: order.id,
        product_id: item.productId ?? item.id ?? null,
        name: normalizeSpaces(item.name),
        quantity: Math.max(1, Number(item.quantity) || 1),
        unit_price: Number(item.price) || 0,
        notes: normalizeSpaces(item.notes) || null,
        removed_ingredients:
          Array.isArray(item.removedIngredients) &&
          item.removedIngredients.length > 0
            ? item.removedIngredients
            : null,
      }));

      if (itemsPayload.length === 0) {
        throw new Error("Nenhum item válido foi gerado para o pedido.");
      }

      const { error: itemsError } = await supabase
        .from("order_items")
        .insert(itemsPayload);

      if (itemsError) throw itemsError;

      return order;
    } catch (error) {
      if (createdOrder?.id) {
        const { error: rollbackError } = await supabase
          .from("orders")
          .delete()
          .eq("id", createdOrder.id);

        if (rollbackError) {
          console.error("Erro ao desfazer pedido órfão:", rollbackError);
        }
      }

      throw error;
    }
  }

  async function handleConfirmOrder() {
    if (cartItems.length === 0) {
      setMessage("Seu carrinho está vazio.");
      return;
    }

    setIsSubmitting(true);
    setMessage("");

    try {
      const validationError = validateDeliveryData({
        mode,
        isLoggedIn,
        savedAddresses,
        selectedAddressId,
        showNewAddressForm,
        activeDelivery: deliveryForm,
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
        deliveryLat != null &&
        deliveryLng != null &&
        !Number.isNaN(Number(deliveryLat)) &&
        !Number.isNaN(Number(deliveryLng)) &&
        (Number(selectedAddress.latitude ?? selectedAddress.lat) !==
          Number(deliveryLat) ||
          Number(selectedAddress.longitude ?? selectedAddress.lng) !==
            Number(deliveryLng));

      if (
        mode === "account" &&
        selectedAddressId &&
        shouldUpdateAddressCoords &&
        user?.id
      ) {
        const { error: addressUpdateError } = await supabase
          .from("addresses")
          .update({
            latitude: Number(deliveryLat),
            longitude: Number(deliveryLng),
          })
          .eq("id", selectedAddressId)
          .eq("user_id", user.id);

        if (addressUpdateError) throw addressUpdateError;
      }

      if (deliveryForm.paymentMethod === PAYMENT_METHOD.ONLINE) {
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
            name: normalizeSpaces(deliveryForm.name),
            email: user?.email ?? GUEST_TEST_EMAIL,
            phone: normalizeDigits(deliveryForm.phone),
          },
          delivery: {
            cep: normalizeDigits(deliveryForm.cep) || null,
            address: normalizeSpaces(deliveryForm.address) || null,
            district: normalizeSpaces(deliveryForm.district) || null,
            city: normalizeSpaces(deliveryForm.city) || null,
            state: deliveryForm.state || null,
            number: normalizeSpaces(deliveryForm.number) || null,
            complement: normalizeSpaces(deliveryForm.complement) || null,
            reference: normalizeSpaces(deliveryForm.reference) || null,
            lat: deliveryLat != null ? Number(deliveryLat) : null,
            lng: deliveryLng != null ? Number(deliveryLng) : null,
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

      if (deliveryForm.paymentMethod === PAYMENT_METHOD.CARD_ON_DELIVERY) {
        const order = await createOrderInSupabase({
          paymentMethod: PAYMENT_METHOD.CARD_ON_DELIVERY,
          paymentStatus: PAYMENT_STATUS.DELIVERY_PAYMENT,
          orderStatus: ORDER_STATUS.PENDING,
          activeDelivery: deliveryForm,
        });

        clearCartOnly();
        navigate(`/payment-success?order_id=${order.id}`, { replace: true });
        return;
      }

      if (deliveryForm.paymentMethod === PAYMENT_METHOD.CASH) {
        const order = await createOrderInSupabase({
          paymentMethod: PAYMENT_METHOD.CASH,
          paymentStatus: PAYMENT_STATUS.DELIVERY_PAYMENT,
          orderStatus: ORDER_STATUS.PENDING,
          activeDelivery: deliveryForm,
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

  return {
    PAYMENT_METHOD,

    mode,
    user,
    cartItems,
    deliveryForm,
    savedAddresses,
    selectedAddressId,
    showNewAddressForm,
    isDeletingAddress,
    isSavingAddress,
    isSubmitting,
    cepLoading,
    isGeocoding,
    canShowMap,
    message,

    subtotal,
    deliveryFee,
    total,
    estimatedDelivery,
    activeDelivery,
    hasAddressReadyForMap,
    skipMapSelection,
    setSkipMapSelection,
    setDeliveryLat,
    setDeliveryLng,
    setHasConfirmedMapLocation,
    setMessage,
    setIsGeocoding,
    lastGeocodeKeyRef,
    deliveryLat,
    deliveryLng,
    hasConfirmedMapLocation,
    summaryNameText,
    summaryAddressText,
    summaryRegionText,
    confirmValidationError,

    handleContinueAsGuest,
    handleBackToModeSelection,
    handleDeliveryChange,
    handleSelectAddress,
    handleStartNewAddress,
    handleSaveNewAddress,
    handleDeleteAddress,
    handleSignOutAndReset,
    handleConfirmOrder,
  };
}