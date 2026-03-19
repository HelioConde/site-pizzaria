import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import styles from "./Admin.module.css";

import DashboardHeader from "../../components/layout/DashboardHeader/DashboardHeader";
import AdminSidebar from "./components/AdminSidebar";

import {
  ADMIN_SECTION,
  ADMIN_SECTIONS,
  ORDER_STATUS,
  PAYMENT_METHOD,
  PAYMENT_STATUS,
  USER_ROLE,
} from "./admin.constants";

import { isSameDay, normalizeOrderStatus } from "./admin.utils";

import DashboardSection from "./sections/DashboardSection";
import OrdersSection from "./sections/OrdersSection";
import ProductsSection from "./sections/ProductsSection";
import CategoriesSection from "./sections/CategoriesSection";
import CustomersSection from "./sections/CustomersSection";
import DeliveryUsersSection from "./sections/DeliveryUsersSection";
import PaymentsSection from "./sections/PaymentsSection";
import ReportsSection from "./sections/ReportsSection";
import SettingsSection from "./sections/SettingsSection";

const NOTIFICATION_SOUND_SRC = `${import.meta.env.BASE_URL}sounds/new-order.mp3`;

export default function Admin() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [accessLoading, setAccessLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  const [message, setMessage] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [updatingOrderId, setUpdatingOrderId] = useState(null);
  const [userInfo, setUserInfo] = useState({
    name: "Administrador",
    email: "",
  });
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [showEnableSoundButton, setShowEnableSoundButton] = useState(false);

  const audioUnlockedRef = useRef(false);
  const knownOrderIdsRef = useRef(new Set());
  const pageTitleRef = useRef(document.title);
  const titleBlinkIntervalRef = useRef(null);

  const activeSection = useMemo(() => {
    const rawSection = String(searchParams.get("section") || "")
      .trim()
      .toLowerCase();

    const validSections = Object.values(ADMIN_SECTION);

    if (validSections.includes(rawSection)) {
      return rawSection;
    }

    return ADMIN_SECTION.DASHBOARD;
  }, [searchParams]);

  const stopTitleBlink = useCallback(() => {
    if (titleBlinkIntervalRef.current) {
      clearInterval(titleBlinkIntervalRef.current);
      titleBlinkIntervalRef.current = null;
    }

    document.title = pageTitleRef.current;
  }, []);

  const startTitleBlink = useCallback((text = "Novo pedido!") => {
    if (titleBlinkIntervalRef.current) return;

    let toggle = false;

    titleBlinkIntervalRef.current = setInterval(() => {
      document.title = toggle ? text : pageTitleRef.current;
      toggle = !toggle;
    }, 1000);
  }, []);

  const requestNotificationPermission = useCallback(async () => {
    if (!("Notification" in window)) return;

    if (Notification.permission === "default") {
      try {
        await Notification.requestPermission();
      } catch (error) {
        console.warn("Não foi possível pedir permissão de notificação:", error);
      }
    }
  }, []);

  const unlockAudio = useCallback(async () => {
    try {
      const audio = new Audio(NOTIFICATION_SOUND_SRC);
      audio.volume = 0.01;
      audio.preload = "auto";

      await audio.play();
      audio.pause();
      audio.currentTime = 0;

      audioUnlockedRef.current = true;
      setAudioEnabled(true);
      setShowEnableSoundButton(false);

      await requestNotificationPermission();
    } catch (error) {
      audioUnlockedRef.current = false;
      setAudioEnabled(false);
      setShowEnableSoundButton(true);
      console.warn("Áudio ainda bloqueado pelo navegador:", error);
    }
  }, [requestNotificationPermission]);

  const unlockAudioManually = useCallback(async () => {
    if (audioUnlockedRef.current) return;
    await unlockAudio();
  }, [unlockAudio]);

  const playNotificationSound = useCallback(() => {
    if (!audioUnlockedRef.current) {
      setAudioEnabled(false);
      setShowEnableSoundButton(true);
      return;
    }

    try {
      const audio = new Audio(NOTIFICATION_SOUND_SRC);
      audio.volume = 0.5;
      audio.preload = "auto";

      audio.play().catch((error) => {
        console.warn("Não foi possível tocar o som:", error);
        audioUnlockedRef.current = false;
        setAudioEnabled(false);
        setShowEnableSoundButton(true);
      });
    } catch (error) {
      console.error("Erro ao tocar som de notificação:", error);
      audioUnlockedRef.current = false;
      setAudioEnabled(false);
      setShowEnableSoundButton(true);
    }
  }, []);

  const showBrowserNotification = useCallback((order) => {
    if (!("Notification" in window)) return;

    if (Notification.permission === "granted") {
      const notification = new Notification("Novo pedido recebido", {
        body: `${order.customer_name || "Cliente"} • ${Number(
          order.total || 0
        ).toLocaleString("pt-BR", {
          style: "currency",
          currency: "BRL",
        })}`,
        icon: `${import.meta.env.BASE_URL}favicon.ico`,
      });

      notification.onclick = () => {
        window.focus();
      };
    }
  }, []);

  const handleChangeSection = useCallback(
    async (section) => {
      const validSections = Object.values(ADMIN_SECTION);

      const nextSection = validSections.includes(section)
        ? section
        : ADMIN_SECTION.DASHBOARD;

      if (nextSection === ADMIN_SECTION.ORDERS) {
        await unlockAudioManually();
      }

      const nextParams = new URLSearchParams(searchParams);
      nextParams.set("section", nextSection);

      setSearchParams(nextParams, { replace: true });
    },
    [searchParams, setSearchParams, unlockAudioManually]
  );

  useEffect(() => {
    const currentSection = searchParams.get("section");
    const validSections = Object.values(ADMIN_SECTION);

    if (!currentSection || !validSections.includes(currentSection)) {
      const nextParams = new URLSearchParams(searchParams);
      nextParams.set("section", ADMIN_SECTION.DASHBOARD);
      setSearchParams(nextParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  useEffect(() => {
    async function checkAudioPermission() {
      try {
        const audio = new Audio(NOTIFICATION_SOUND_SRC);
        audio.volume = 0.01;
        audio.preload = "auto";

        await audio.play();
        audio.pause();
        audio.currentTime = 0;

        audioUnlockedRef.current = true;
        setAudioEnabled(true);
        setShowEnableSoundButton(false);
      } catch {
        audioUnlockedRef.current = false;
        setAudioEnabled(false);
        setShowEnableSoundButton(true);
      }
    }

    checkAudioPermission();

    const handleFocus = () => {
      stopTitleBlink();
    };

    window.addEventListener("focus", handleFocus);

    return () => {
      window.removeEventListener("focus", handleFocus);
      stopTitleBlink();
    };
  }, [stopTitleBlink]);

  useEffect(() => {
    window.addEventListener("click", unlockAudio, { once: true });
    window.addEventListener("keydown", unlockAudio, { once: true });

    return () => {
      window.removeEventListener("click", unlockAudio);
      window.removeEventListener("keydown", unlockAudio);
    };
  }, [unlockAudio]);

  const loadOrders = useCallback(async () => {
    setLoading(true);

    try {
      const { data: ordersData, error: ordersError } = await supabase
        .from("orders")
        .select("*")
        .order("created_at", { ascending: false });

      if (ordersError) throw ordersError;

      const safeOrders = ordersData ?? [];

      if (!safeOrders.length) {
        setOrders([]);
        setMessage("");
        knownOrderIdsRef.current = new Set();
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
        normalized_status: normalizeOrderStatus(order),
        order_items: itemsByOrderId[order.id] ?? [],
      }));

      setOrders(mergedOrders);
      setMessage("");
      knownOrderIdsRef.current = new Set(mergedOrders.map((order) => order.id));
    } catch (error) {
      console.error("Erro ao carregar pedidos do admin:", error);
      setOrders([]);
      setMessage("Não foi possível carregar os pedidos.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;

    async function validateAdminAccess() {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session) {
          navigate("/auth", { replace: true, state: { from: "/admin" } });
          return;
        }

        const { data: profile, error } = await supabase
          .from("profiles")
          .select("role, name")
          .eq("id", session.user.id)
          .maybeSingle();

        if (error) throw error;

        const role = String(profile?.role || "").trim().toLowerCase();

        if (role !== USER_ROLE.ADMIN) {
          navigate("/", { replace: true });
          return;
        }

        if (!active) return;

        setUserInfo({
          name:
            profile?.name ||
            session.user.user_metadata?.name ||
            session.user.email?.split("@")[0] ||
            "Administrador",
          email: session.user.email || "",
        });

        setHasAccess(true);
        await loadOrders();
      } catch (error) {
        console.error("Erro ao validar acesso do admin:", error);
        navigate("/", { replace: true });
      } finally {
        if (active) {
          setAccessLoading(false);
        }
      }
    }

    validateAdminAccess();

    return () => {
      active = false;
    };
  }, [navigate, loadOrders]);

  useEffect(() => {
    if (!hasAccess) return;

    function notifyNewOrder(order) {
      setMessage(`Novo pedido recebido de ${order.customer_name || "Cliente"}.`);
      playNotificationSound();
      showBrowserNotification(order);
      startTitleBlink("🔔 Novo pedido!");
    }

    const channel = supabase
      .channel("orders-admin")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "orders",
        },
        async (payload) => {
          const newOrder = payload.new;
          const alreadyKnown = knownOrderIdsRef.current.has(newOrder.id);

          await loadOrders();

          if (alreadyKnown) return;

          notifyNewOrder(newOrder);
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "orders",
        },
        async () => {
          await loadOrders();
        }
      )
      .subscribe((status) => {
        console.log("ADMIN realtime subscribe status:", status);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [
    hasAccess,
    loadOrders,
    playNotificationSound,
    showBrowserNotification,
    startTitleBlink,
  ]);

  async function handleLogout() {
    await supabase.auth.signOut();
    navigate("/", { replace: true });
  }

  async function handleUpdateOrderStatus(orderId, nextStatus) {
    const currentOrder = orders.find((order) => order.id === orderId);

    if (!currentOrder) {
      setMessage("Pedido não encontrado.");
      return;
    }

    if (currentOrder.normalized_status === nextStatus) {
      return;
    }

    setUpdatingOrderId(orderId);
    setMessage("");

    const previousOrders = orders;

    setOrders((prevOrders) =>
      prevOrders.map((order) =>
        order.id === orderId
          ? {
              ...order,
              order_status: nextStatus,
              normalized_status: nextStatus,
            }
          : order
      )
    );

    try {
      const updatePayload = {
        order_status: nextStatus,
      };

      if (nextStatus === ORDER_STATUS.WAITING_COURIER) {
        updatePayload.delivery_user_id = null;
        updatePayload.delivery_started_at = null;
      }

      if (nextStatus === ORDER_STATUS.CANCELLED) {
        updatePayload.payment_status =
          currentOrder.payment_method === PAYMENT_METHOD.ONLINE
            ? PAYMENT_STATUS.CANCELLED
            : currentOrder.payment_status;
      }

      const { error } = await supabase
        .from("orders")
        .update(updatePayload)
        .eq("id", orderId);

      if (error) throw error;

      setMessage("Status do pedido atualizado com sucesso.");
      await loadOrders();
    } catch (error) {
      console.error("Erro ao atualizar status do pedido:", error);
      setOrders(previousOrders);
      setMessage("Não foi possível atualizar o status do pedido.");
    } finally {
      setUpdatingOrderId(null);
    }
  }

  const filteredOrders = useMemo(() => {
    if (statusFilter === "all") return orders;
    return orders.filter((order) => order.normalized_status === statusFilter);
  }, [orders, statusFilter]);

  const stats = useMemo(() => {
    const today = new Date();

    const sameDayOrders = orders.filter((order) => {
      if (!order.created_at) return false;

      const createdAt = new Date(order.created_at);
      if (Number.isNaN(createdAt.getTime())) return false;

      return isSameDay(createdAt, today);
    });

    return {
      totalToday: sameDayOrders.length,
      pending: orders.filter(
        (order) => order.normalized_status === ORDER_STATUS.PENDING
      ).length,
      preparing: orders.filter(
        (order) => order.normalized_status === ORDER_STATUS.PREPARING
      ).length,
      waitingCourier: orders.filter(
        (order) => order.normalized_status === ORDER_STATUS.WAITING_COURIER
      ).length,
      outForDelivery: orders.filter(
        (order) => order.normalized_status === ORDER_STATUS.DELIVERY
      ).length,
      delivered: orders.filter(
        (order) => order.normalized_status === ORDER_STATUS.DELIVERED
      ).length,
      revenueToday: sameDayOrders
        .filter((order) => order.normalized_status !== ORDER_STATUS.CANCELLED)
        .reduce((total, order) => total + Number(order.total || 0), 0),
    };
  }, [orders]);

  function renderSection() {
    switch (activeSection) {
      case ADMIN_SECTION.DASHBOARD:
        return <DashboardSection stats={stats} />;

      case ADMIN_SECTION.ORDERS:
        return (
          <OrdersSection
            message={message}
            stats={stats}
            loading={loading}
            filteredOrders={filteredOrders}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            updatingOrderId={updatingOrderId}
            handleUpdateOrderStatus={handleUpdateOrderStatus}
          />
        );

      case ADMIN_SECTION.PRODUCTS:
        return <ProductsSection />;

      case ADMIN_SECTION.CATEGORIES:
        return <CategoriesSection />;

      case ADMIN_SECTION.CUSTOMERS:
        return <CustomersSection />;

      case ADMIN_SECTION.DELIVERY_USERS:
        return <DeliveryUsersSection />;

      case ADMIN_SECTION.PAYMENTS:
        return <PaymentsSection />;

      case ADMIN_SECTION.REPORTS:
        return <ReportsSection />;

      case ADMIN_SECTION.SETTINGS:
        return <SettingsSection />;

      default:
        return <DashboardSection stats={stats} />;
    }
  }

  if (accessLoading) {
    return (
      <main className={styles.page}>
        <section className={styles.content}>
          <div className={styles.container}>
            <div className={styles.emptyState}>
              <p>Validando acesso ao painel...</p>
            </div>
          </div>
        </section>
      </main>
    );
  }

  if (!hasAccess) {
    return null;
  }

  return (
    <main className={styles.page}>
      <DashboardHeader
        title="Painel Admin"
        userName={userInfo.name}
        userEmail={userInfo.email}
        accountLabel="Minha conta"
        accountRoute={`/admin?section=${activeSection}`}
        onLogout={handleLogout}
      />

      {showEnableSoundButton ? (
        <div className={styles.soundAlert}>
          <div className={styles.soundAlertContent}>
            <span className={styles.soundAlertText}>
              O som das notificações está desativado.
            </span>

            <button
              type="button"
              className={styles.soundAlertButton}
              onClick={unlockAudio}
            >
              Ativar som
            </button>
          </div>
        </div>
      ) : null}

      <div className={styles.adminShell}>
        <AdminSidebar
          sections={ADMIN_SECTIONS}
          activeSection={activeSection}
          onChangeSection={handleChangeSection}
        />

        <div className={styles.adminMain}>{renderSection()}</div>
      </div>
    </main>
  );
}