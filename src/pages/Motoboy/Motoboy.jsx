import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import styles from "./Motoboy.module.css";

import DashboardHeader from "../../components/layout/DashboardHeader/DashboardHeader";
import MotoboyStats from "./components/MotoboyStats";
import MotoboyOrderCard from "./components/MotoboyOrderCard";

import { ORDER_STATUS, USER_ROLE } from "./motoboy.constants";
import { isSameDay, normalizeOrderStatus } from "../Admin/admin.utils";

export default function Motoboy() {
  const navigate = useNavigate();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [accessLoading, setAccessLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  const [message, setMessage] = useState("");
  const [updatingOrderId, setUpdatingOrderId] = useState(null);
  const [userInfo, setUserInfo] = useState({
    name: "Motoboy",
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

      const safeOrders = (ordersData ?? [])
        .map((order) => ({
          ...order,
          normalized_status: normalizeOrderStatus(order),
        }))
        .filter((order) => order.normalized_status === ORDER_STATUS.DELIVERY);

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
        order_items: itemsByOrderId[order.id] ?? [],
      }));

      setOrders(mergedOrders);
      setMessage("");
    } catch (error) {
      console.error("Erro ao carregar pedidos do motoboy:", error);
      setOrders([]);
      setMessage("Não foi possível carregar os pedidos para entrega.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;

    async function validateDeliveryAccess() {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session) {
          navigate("/auth", { replace: true, state: { from: "/motoboy" } });
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

        if (role !== USER_ROLE.DELIVERY) {
          navigate("/", { replace: true });
          return;
        }

        if (!active) return;

        setUserInfo({
          name:
            profile?.name ||
            session.user.user_metadata?.name ||
            session.user.email?.split("@")[0] ||
            "Motoboy",
          email: session.user.email || "",
        });

        setHasAccess(true);
        await loadOrders();
      } catch (error) {
        console.error("Erro ao validar acesso do motoboy:", error);
        navigate("/", { replace: true });
      } finally {
        if (active) {
          setAccessLoading(false);
        }
      }
    }

    validateDeliveryAccess();

    return () => {
      active = false;
    };
  }, [navigate, loadOrders]);

  useEffect(() => {
    if (!hasAccess) return;

    const channel = supabase
      .channel("orders-motoboy")
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
async function handleMarkDelivered(orderId) {
  setUpdatingOrderId(orderId);
  setMessage("");

  try {
    const { error } = await supabase
      .from("orders")
      .update({
        order_status: ORDER_STATUS.DELIVERED,
        delivered_at: new Date().toISOString(),
      })
      .eq("id", orderId);

    if (error) throw error;

    setMessage("Pedido marcado como entregue com sucesso.");
    await loadOrders();
  } catch (error) {
    console.error("Erro ao marcar pedido como entregue:", error);
    setMessage("Não foi possível atualizar o pedido.");
  } finally {
    setUpdatingOrderId(null);
  }
}
  const stats = useMemo(() => {
    const today = new Date();

    const deliveredToday = orders.filter((order) => {
      if (!order.created_at) return false;

      const createdAt = new Date(order.created_at);
      if (Number.isNaN(createdAt.getTime())) return false;

      return isSameDay(createdAt, today);
    }).length;

    return {
      totalRoutes: orders.length,
      deliveredToday,
    };
  }, [orders]);

  if (accessLoading) {
    return (
      <main className={styles.page}>
        <section className={styles.content}>
          <div className={styles.container}>
            <div className={styles.emptyState}>
              <p>Validando acesso do motoboy...</p>
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
        badge="Painel do motoboy"
        userName={userInfo.name}
        userEmail={userInfo.email}
        accountLabel="Minha área"
        accountRoute="/motoboy"
        onLogout={handleLogout}
      />

      <section className={styles.hero}>
        <div className={styles.container}>
          <span className={styles.kicker}>Painel do motoboy</span>
          <h1 className={styles.title}>Entregas em rota</h1>
          <p className={styles.subtitle}>
            Veja os pedidos prontos para entrega e marque quando forem concluídos.
          </p>
        </div>
      </section>

      <section className={styles.content}>
        <div className={styles.container}>
          {message ? (
            <p className={styles.pageMessage} role="status">
              {message}
            </p>
          ) : null}

          <MotoboyStats
            totalRoutes={stats.totalRoutes}
            deliveredToday={stats.deliveredToday}
          />

          <section className={styles.ordersSection}>
            {loading ? (
              <div className={styles.emptyState}>
                <p>Carregando entregas...</p>
              </div>
            ) : !orders.length ? (
              <div className={styles.emptyState}>
                <p>Nenhum pedido em rota no momento.</p>
              </div>
            ) : (
              <div className={styles.ordersList}>
                {orders.map((order) => (
                  <MotoboyOrderCard
                    key={order.id}
                    order={order}
                    updatingOrderId={updatingOrderId}
                    onMarkDelivered={handleMarkDelivered}
                  />
                ))}
              </div>
            )}
          </section>
        </div>
      </section>
    </main>
  );
}