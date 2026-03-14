import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import styles from "./Account.module.css";

import AccountHeader from "./components/AccountHeader";
import AccountInfoCard from "./components/AccountInfoCard";
import DefaultAddressCard from "./components/DefaultAddressCard";
import AddressList from "./components/AddressList";
import AddressForm from "./components/AddressForm";
import OrdersRecentList from "./components/OrdersRecentList";
import QuickActions from "./components/QuickActions";

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

const initialAddressForm = {
  id: null,
  label: "",
  cep: "",
  address: "",
  district: "",
  city: "",
  state: "",
  number: "",
  complement: "",
  reference: "",
  is_default: false,
};

function formatPhone(value) {
  const digits = String(value || "").replace(/\D/g, "").slice(0, 11);

  if (!digits) return "Não informado";
  if (digits.length <= 2) return digits;
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

function formatCep(value) {
  const digits = String(value || "").replace(/\D/g, "").slice(0, 8);

  if (digits.length <= 5) return digits;
  return `${digits.slice(0, 5)}-${digits.slice(5)}`;
}

function normalizeAddressForm(form) {
  return {
    ...form,
    cep: String(form.cep || "").replace(/\D/g, ""),
    label: String(form.label || "").trim(),
    address: String(form.address || "").trim(),
    district: String(form.district || "").trim(),
    city: String(form.city || "").trim(),
    state: String(form.state || "").trim().toUpperCase(),
    number: String(form.number || "").trim(),
    complement: String(form.complement || "").trim(),
    reference: String(form.reference || "").trim(),
  };
}

function addressToForm(address = {}) {
  return {
    id: address.id ?? null,
    label: address.label ?? "",
    cep: formatCep(address.cep ?? ""),
    address: address.address ?? "",
    district: address.district ?? "",
    city: address.city ?? "",
    state: address.state ?? "",
    number: address.number ?? "",
    complement: address.complement ?? "",
    reference: address.reference ?? "",
    is_default: !!address.is_default,
  };
}

function normalizeOrderDisplayStatus(order = {}) {
  const rawOrderStatus = String(order.order_status || order.status || "")
    .trim()
    .toLowerCase();

  if (
    [
      "pending",
      "new",
      "novo",
      "confirmed",
      "confirmado",
      "awaiting",
      "aguardando",
    ].includes(rawOrderStatus)
  ) {
    return ORDER_STATUS.PENDING;
  }

  if (["preparing", "em_preparo", "preparo"].includes(rawOrderStatus)) {
    return ORDER_STATUS.PREPARING;
  }

  if (["delivery", "out_for_delivery", "saiu_para_entrega"].includes(rawOrderStatus)) {
    return ORDER_STATUS.DELIVERY;
  }

  if (["delivered", "entregue"].includes(rawOrderStatus)) {
    return ORDER_STATUS.DELIVERED;
  }

  if (["cancelled", "canceled", "cancelado"].includes(rawOrderStatus)) {
    return ORDER_STATUS.CANCELLED;
  }

  return ORDER_STATUS.PENDING;
}

export default function Account() {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const [addresses, setAddresses] = useState([]);
  const [addressesLoading, setAddressesLoading] = useState(true);

  const [isAddressFormOpen, setIsAddressFormOpen] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState(null);
  const [addressForm, setAddressForm] = useState(initialAddressForm);

  const [savingAddress, setSavingAddress] = useState(false);
  const [deletingAddressId, setDeletingAddressId] = useState(null);
  const [settingDefaultId, setSettingDefaultId] = useState(null);

  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(true);

  const [message, setMessage] = useState("");

  async function loadAddresses(userId) {
    setAddressesLoading(true);

    try {
      const { data, error } = await supabase
        .from("addresses")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: true });

      if (error) throw error;

      setAddresses(data ?? []);
    } catch (error) {
      console.error("Erro ao carregar endereços:", error);
      setMessage("Não foi possível carregar os endereços.");
    } finally {
      setAddressesLoading(false);
    }
  }

  async function loadOrders(userId) {
    setOrdersLoading(true);

    try {
      const { data: ordersData, error: ordersError } = await supabase
        .from("orders")
        .select("*")
        .eq("user_id", userId)
        .or("is_test_order.is.null,is_test_order.eq.false")
        .order("created_at", { ascending: false })
        .limit(10);

      if (ordersError) throw ordersError;

      const safeOrders = (ordersData ?? []).filter(
        (order) => order.user_id === userId && !order.is_test_order
      );

      if (!safeOrders.length) {
        setOrders([]);
        return;
      }

      const orderIds = safeOrders.map((order) => order.id);

      const { data: itemsData, error: itemsError } = await supabase
        .from("order_items")
        .select("*")
        .in("order_id", orderIds);

      if (itemsError) throw itemsError;

      const itemsByOrderId = (itemsData ?? []).reduce((acc, item) => {
        if (!acc[item.order_id]) {
          acc[item.order_id] = [];
        }

        acc[item.order_id].push(item);
        return acc;
      }, {});

      const mergedOrders = safeOrders.map((order) => ({
        ...order,
        order_items: itemsByOrderId[order.id] ?? [],
        display_status: normalizeOrderDisplayStatus(order),
      }));

      setOrders(mergedOrders);
    } catch (error) {
      console.error("Erro ao carregar pedidos:", error);
      setOrders([]);
      setMessage("Não foi possível carregar os pedidos.");
    } finally {
      setOrdersLoading(false);
    }
  }

  useEffect(() => {
    let active = true;

    async function loadSession() {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session) {
          navigate("/auth", { replace: true, state: { from: "/account" } });
          return;
        }

        if (!active) return;

        setUser(session.user);

        await Promise.all([
          loadAddresses(session.user.id),
          loadOrders(session.user.id),
        ]);
      } catch (error) {
        console.error("Erro ao carregar conta:", error);

        if (active) {
          setOrdersLoading(false);
          setAddressesLoading(false);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadSession();

    return () => {
      active = false;
    };
  }, [navigate]);

  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel(`orders-account-${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "orders",
          filter: `user_id=eq.${user.id}`,
        },
        () => loadOrders(user.id)
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  async function fetchAddressByCep(rawCep) {
    const cep = String(rawCep || "").replace(/\D/g, "");

    if (cep.length !== 8) return;

    try {
      const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      const data = await response.json();

      if (data.erro) {
        setMessage("CEP não encontrado.");
        return;
      }

      setAddressForm((prev) => ({
        ...prev,
        cep: formatCep(cep),
        address: data.logradouro || prev.address,
        district: data.bairro || prev.district,
        city: data.localidade || prev.city,
        state: data.uf || prev.state,
      }));
    } catch (error) {
      console.error("Erro ao buscar CEP:", error);
      setMessage("Não foi possível buscar o CEP.");
    }
  }

  function openNewAddressForm() {
    setEditingAddressId(null);
    setAddressForm({
      ...initialAddressForm,
      is_default: addresses.length === 0,
    });
    setIsAddressFormOpen(true);
    setMessage("");
  }

  function openEditAddressForm(address) {
    setEditingAddressId(address.id);
    setAddressForm(addressToForm(address));
    setIsAddressFormOpen(true);
    setMessage("");
  }

  function closeAddressForm() {
    setIsAddressFormOpen(false);
    setEditingAddressId(null);
    setAddressForm(initialAddressForm);
  }

  function handleAddressChange(event) {
    const { name, value, type, checked } = event.target;

    let nextValue = type === "checkbox" ? checked : value;

    if (name === "cep") {
      const digits = String(value).replace(/\D/g, "").slice(0, 8);
      nextValue = formatCep(digits);

      if (digits.length === 8) {
        fetchAddressByCep(digits);
      }
    }

    if (name === "state") {
      nextValue = String(value)
        .replace(/[^a-zA-Z]/g, "")
        .slice(0, 2)
        .toUpperCase();
    }

    setAddressForm((prev) => ({
      ...prev,
      [name]: nextValue,
    }));
  }

  async function handleSaveAddress() {
    if (!user) return;

    const form = normalizeAddressForm(addressForm);

    if (!form.address || !form.number || !form.city || !form.state) {
      setMessage("Preencha endereço, número, cidade e estado.");
      return;
    }

    setSavingAddress(true);
    setMessage("");

    try {
      if (form.is_default) {
        const { error: resetDefaultError } = await supabase
          .from("addresses")
          .update({ is_default: false })
          .eq("user_id", user.id);

        if (resetDefaultError) throw resetDefaultError;
      }

      if (editingAddressId) {
        const { error } = await supabase
          .from("addresses")
          .update({
            label: form.label || null,
            cep: form.cep || null,
            address: form.address,
            district: form.district || null,
            city: form.city || null,
            state: form.state || null,
            number: form.number,
            complement: form.complement || null,
            reference: form.reference || null,
            is_default: !!form.is_default,
          })
          .eq("id", editingAddressId)
          .eq("user_id", user.id);

        if (error) throw error;
      } else {
        const shouldBeDefault = addresses.length === 0 ? true : !!form.is_default;

        const { error } = await supabase.from("addresses").insert({
          user_id: user.id,
          label: form.label || null,
          cep: form.cep || null,
          address: form.address,
          district: form.district || null,
          city: form.city || null,
          state: form.state || null,
          number: form.number,
          complement: form.complement || null,
          reference: form.reference || null,
          is_default: shouldBeDefault,
        });

        if (error) throw error;
      }

      await loadAddresses(user.id);
      closeAddressForm();

      setMessage(
        editingAddressId
          ? "Endereço atualizado com sucesso."
          : "Endereço salvo com sucesso."
      );
    } catch (error) {
      console.error("Erro ao salvar endereço:", error);
      setMessage("Não foi possível salvar o endereço.");
    } finally {
      setSavingAddress(false);
    }
  }

  async function handleDeleteAddress(addressId) {
    if (!user) return;

    const confirmed = window.confirm(
      "Tem certeza que deseja excluir este endereço?"
    );
    if (!confirmed) return;

    setDeletingAddressId(addressId);
    setMessage("");

    try {
      const target = addresses.find((item) => item.id === addressId);

      const { error } = await supabase
        .from("addresses")
        .delete()
        .eq("id", addressId)
        .eq("user_id", user.id);

      if (error) throw error;

      const remaining = addresses.filter((item) => item.id !== addressId);

      if (target?.is_default && remaining.length > 0) {
        const nextDefault = remaining[0];

        const { error: updateError } = await supabase
          .from("addresses")
          .update({ is_default: true })
          .eq("id", nextDefault.id)
          .eq("user_id", user.id);

        if (updateError) throw updateError;
      }

      await loadAddresses(user.id);
      setMessage("Endereço removido com sucesso.");
    } catch (error) {
      console.error("Erro ao excluir endereço:", error);
      setMessage("Não foi possível excluir o endereço.");
    } finally {
      setDeletingAddressId(null);
    }
  }

  async function handleSetDefaultAddress(addressId) {
    if (!user) return;

    setSettingDefaultId(addressId);
    setMessage("");

    try {
      const { error: resetError } = await supabase
        .from("addresses")
        .update({ is_default: false })
        .eq("user_id", user.id);

      if (resetError) throw resetError;

      const { error: setError } = await supabase
        .from("addresses")
        .update({ is_default: true })
        .eq("id", addressId)
        .eq("user_id", user.id);

      if (setError) throw setError;

      await loadAddresses(user.id);
      setMessage("Endereço principal atualizado.");
    } catch (error) {
      console.error("Erro ao definir endereço principal:", error);
      setMessage("Não foi possível definir o endereço principal.");
    } finally {
      setSettingDefaultId(null);
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    navigate("/", { replace: true });
  }

  const metadata = user?.user_metadata || {};

  const firstName =
    metadata?.name?.trim()?.split(" ")[0] ||
    user?.email?.split("@")[0] ||
    "Cliente";

  const defaultAddress = useMemo(() => {
    if (!addresses.length) return null;
    return addresses.find((item) => item.is_default) ?? addresses[0];
  }, [addresses]);

  if (loading) {
    return (
      <main className={styles.page}>
        <div className={styles.container}>
          <div className={styles.loadingCard}>Carregando sua conta...</div>
        </div>
      </main>
    );
  }

  return (
    <main className={styles.page}>
      <AccountHeader firstName={firstName} />

      <section className={styles.content}>
        <div className={styles.container}>
          {message ? <p className={styles.pageMessage}>{message}</p> : null}

          <div className={styles.grid}>
            <AccountInfoCard
              name={metadata.name || "Não informado"}
              email={user?.email || "Não informado"}
              phone={formatPhone(metadata.phone)}
            />

            <DefaultAddressCard
              loading={addressesLoading}
              defaultAddress={defaultAddress}
              formatCep={formatCep}
            />

            <AddressList
              loading={addressesLoading}
              addresses={addresses}
              settingDefaultId={settingDefaultId}
              deletingAddressId={deletingAddressId}
              onAdd={openNewAddressForm}
              onEdit={openEditAddressForm}
              onDelete={handleDeleteAddress}
              onSetDefault={handleSetDefaultAddress}
              formatCep={formatCep}
            />

            {isAddressFormOpen ? (
              <AddressForm
                editingAddressId={editingAddressId}
                addressForm={addressForm}
                savingAddress={savingAddress}
                onChange={handleAddressChange}
                onCancel={closeAddressForm}
                onSave={handleSaveAddress}
              />
            ) : null}

            <OrdersRecentList orders={orders} loading={ordersLoading} />

            <QuickActions onLogout={handleLogout} />
          </div>
        </div>
      </section>
    </main>
  );
}