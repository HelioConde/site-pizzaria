import { DEFAULT_DELIVERY_FEE } from "./checkout.constants";

export function formatPrice(value) {
    if (value == null) return null;

    return new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
    }).format(Number(value) || 0);
}

export function normalizeDeliveryFee(value) {
    const numericValue = Number(value);

    if (!Number.isFinite(numericValue) || numericValue < 0) {
        return DEFAULT_DELIVERY_FEE;
    }

    return numericValue;
}

export function normalizeDigits(value) {
    return String(value || "").replace(/\D/g, "");
}

export function normalizeSpaces(value) {
    return String(value || "").replace(/\s+/g, " ").trim();
}

export function formatCep(value) {
    const digits = normalizeDigits(value).slice(0, 8);
    if (digits.length <= 5) return digits;
    return `${digits.slice(0, 5)}-${digits.slice(5)}`;
}

export function formatPhone(value) {
    const digits = normalizeDigits(value).slice(0, 11);

    if (!digits) return "";
    if (digits.length <= 2) return `(${digits}`;
    if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    if (digits.length <= 10) {
        return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
    }

    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

export function formatState(value) {
    return String(value || "")
        .replace(/[^a-zA-Z]/g, "")
        .slice(0, 2)
        .toUpperCase();
}

export function formatChangeFor(value) {
    const cleaned = String(value || "").replace(/[^\d,]/g, "");

    if (!cleaned) return "";

    const parts = cleaned.split(",");
    const integerPart = parts[0].slice(0, 6);
    const decimalPart = parts[1] ? parts[1].slice(0, 2) : "";

    return decimalPart ? `${integerPart},${decimalPart}` : integerPart;
}

export function formatAddressNumber(value) {
    return String(value || "")
        .replace(/[^0-9a-zA-Z/\-\s]/g, "")
        .slice(0, 12);
}

export function parseMoneyValue(value) {
    if (!value) return 0;
    return Number(String(value).replace(/\./g, "").replace(",", "."));
}

export function sanitizeCartItem(item) {
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

export function mapUserMetadataToForm(metadata = {}) {
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

export function mapAddressToForm(address, base = {}) {
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

export function buildFullAddress(activeDelivery) {
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

export function hasEnoughAddressForMap(activeDelivery) {
    return Boolean(
        normalizeSpaces(activeDelivery.address) &&
        normalizeSpaces(activeDelivery.number) &&
        normalizeSpaces(activeDelivery.city) &&
        String(activeDelivery.state || "").trim().length === 2
    );
}

export function validateDeliveryData({
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