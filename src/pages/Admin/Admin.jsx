import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
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

export default function Admin() {
  const navigate = useNavigate();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [accessLoading, setAccessLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  const [message, setMessage] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [updatingOrderId, setUpdatingOrderId] = useState(null);
  const [activeSection, setActiveSection] = useState(ADMIN_SECTION.DASHBOARD);
  const [userInfo, setUserInfo] = useState({
    name: "Administrador",
    email: "",
  });

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

        if (error) {
          throw error;
        }

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

    const channel = supabase
      .channel("orders-admin")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "orders",
        },
        loadOrders
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [hasAccess, loadOrders]);

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

      if (nextStatus === ORDER_STATUS.DELIVERY) {
        updatePayload.delivery_started_at = new Date().toISOString();
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
        accountRoute="/admin"
        onLogout={handleLogout}
      />

      <div className={styles.adminShell}>
        <AdminSidebar
          sections={ADMIN_SECTIONS}
          activeSection={activeSection}
          onChangeSection={setActiveSection}
        />

        <div className={styles.adminMain}>
          {renderSection()}
        </div>
      </div>
    </main>
  );
}