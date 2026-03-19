import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import AdminContentHeader from "../components/AdminContentHeader";
import AdminFilters from "../components/AdminFilters";
import AdminOrderCard from "../components/AdminOrderCard";
import AdminFloatingOrderChat from "../components/AdminFloatingOrderChat";
import ToastContainer from "../../../components/ui/Toast/ToastContainer";
import { FILTER_OPTIONS } from "../admin.constants";
import styles from "../Admin.module.css";
import { unlockChatSound, playChatSound } from "../../../utils/chatSound";
import { startTitleBlink, stopTitleBlink } from "../../../utils/titleNotifier";
import { showChatBrowserNotification, requestChatNotificationPermission, } from "../../../utils/chatNotification";
import { supabase } from "../../../lib/supabase";

const MAX_VISIBLE_CHATS = 4;

export default function OrdersSection({
  message,
  stats,
  loading,
  filteredOrders,
  statusFilter,
  setStatusFilter,
  updatingOrderId,
  handleUpdateOrderStatus,
}) {
  const [openChats, setOpenChats] = useState([]);
  const [highlightedOrderIds, setHighlightedOrderIds] = useState({});
  const [focusRequestByOrderId, setFocusRequestByOrderId] = useState({});
  const [toasts, setToasts] = useState([]);

  const orderRefs = useRef({});
  const highlightTimeoutsRef = useRef({});
  const knownNotificationMessageIdsRef = useRef(new Set());
  const chatChannelsRef = useRef([]);

  const orderMap = useMemo(() => {
    return filteredOrders.reduce((acc, order) => {
      acc[order.id] = order;
      return acc;
    }, {});
  }, [filteredOrders]);

  const watchedOrders = useMemo(() => {
    return filteredOrders.map((order) => ({
      id: order.id,
      customer_name: order.customer_name,
    }));
  }, [filteredOrders]);

  const watchedOrderIdsKey = useMemo(() => {
    return watchedOrders.map((order) => order.id).join("|");
  }, [watchedOrders]);

  const addToast = useCallback((title, messageText) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

    setToasts((prev) => [
      ...prev,
      {
        id,
        title,
        message: messageText,
      },
    ]);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const registerOrderRef = useCallback((orderId, node) => {
    if (node) {
      orderRefs.current[orderId] = node;
      return;
    }

    delete orderRefs.current[orderId];
  }, []);

  const pulseOrder = useCallback((orderId) => {
    setHighlightedOrderIds((prev) => ({
      ...prev,
      [orderId]: true,
    }));

    if (highlightTimeoutsRef.current[orderId]) {
      clearTimeout(highlightTimeoutsRef.current[orderId]);
    }

    highlightTimeoutsRef.current[orderId] = setTimeout(() => {
      setHighlightedOrderIds((prev) => ({
        ...prev,
        [orderId]: false,
      }));

      delete highlightTimeoutsRef.current[orderId];
    }, 2600);
  }, []);

  const enforceChatLimit = useCallback((chats) => {
    if (chats.length <= MAX_VISIBLE_CHATS) return chats;
    return chats.slice(chats.length - MAX_VISIBLE_CHATS);
  }, []);

  const markChatAsRead = useCallback((orderId) => {
    setOpenChats((prev) =>
      prev.map((chat) =>
        chat.orderId === orderId
          ? {
            ...chat,
            unreadCount: 0,
          }
          : chat
      )
    );
  }, []);

  const openChatForOrder = useCallback(
    (order) => {
      if (!order?.id) return;

      setOpenChats((prev) => {
        const existing = prev.find((chat) => chat.orderId === order.id);

        if (existing) {
          const withoutCurrent = prev.filter((chat) => chat.orderId !== order.id);

          return enforceChatLimit([
            ...withoutCurrent,
            {
              ...existing,
              minimized: false,
              unreadCount: 0,
            },
          ]);
        }

        return enforceChatLimit([
          ...prev,
          {
            orderId: order.id,
            minimized: false,
            unreadCount: 0,
            manual: true,
          },
        ]);
      });

      pulseOrder(order.id);
    },
    [enforceChatLimit, pulseOrder]
  );

  const closeChat = useCallback((orderId) => {
    setOpenChats((prev) => prev.filter((chat) => chat.orderId !== orderId));
  }, []);

  const toggleMinimizeChat = useCallback((orderId) => {
    setOpenChats((prev) =>
      prev.map((chat) =>
        chat.orderId === orderId
          ? {
            ...chat,
            minimized: !chat.minimized,
          }
          : chat
      )
    );
  }, []);

  const focusOrder = useCallback(
    (orderId) => {
      setFocusRequestByOrderId((prev) => ({
        ...prev,
        [orderId]: Date.now(),
      }));

      pulseOrder(orderId);
      markChatAsRead(orderId);

      const node = orderRefs.current[orderId];

      if (node) {
        node.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }
    },
    [markChatAsRead, pulseOrder]
  );

  useEffect(() => {
    const handleUnlockChatSound = () => {
      unlockChatSound();
    };

    window.addEventListener("pointerdown", handleUnlockChatSound, { once: true });
    window.addEventListener("keydown", handleUnlockChatSound, { once: true });
    window.addEventListener("touchstart", handleUnlockChatSound, { once: true });

    return () => {
      window.removeEventListener("pointerdown", handleUnlockChatSound);
      window.removeEventListener("keydown", handleUnlockChatSound);
      window.removeEventListener("touchstart", handleUnlockChatSound);
    };
  }, []);

  useEffect(() => {
    requestChatNotificationPermission();
  }, []);

  useEffect(() => {
    const handleFocus = () => {
      stopTitleBlink();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        stopTitleBlink();
      }
    };

    window.addEventListener("focus", handleFocus);
    window.addEventListener("click", handleFocus);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener("click", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  useEffect(() => {
    chatChannelsRef.current.forEach((channel) => {
      supabase.removeChannel(channel);
    });
    chatChannelsRef.current = [];

    if (!watchedOrders.length) return;

    let active = true;

    watchedOrders.forEach((order) => {
      const channel = supabase
        .channel(`admin-orders-section-chat-watch-${order.id}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "order_messages",
            filter: `order_id=eq.${order.id}`,
          },
          (payload) => {
            if (!active) return;

            const newMessage = payload.new;
            const isCustomerMessage = newMessage.sender_role === "customer";

            if (!isCustomerMessage) return;

            if (knownNotificationMessageIdsRef.current.has(newMessage.id)) {
              return;
            }

            knownNotificationMessageIdsRef.current.add(newMessage.id);

            playChatSound();
            startTitleBlink(
              `🔴 Nova mensagem - Pedido ${String(order.id).slice(0, 4)}`
            );

            addToast(
              `📩 Pedido #${String(order.id).slice(0, 4)}`,
              `${order.customer_name || "Cliente"} enviou uma nova mensagem`
            );

            showChatBrowserNotification(
              `Pedido #${String(order.id).slice(0, 4)}`,
              `${order.customer_name || "Cliente"} enviou uma mensagem`
            );

            pulseOrder(order.id);

            setOpenChats((prev) => {
              const existing = prev.find((chat) => chat.orderId === order.id);

              if (existing) {
                const withoutCurrent = prev.filter(
                  (chat) => chat.orderId !== order.id
                );

                return enforceChatLimit([
                  ...withoutCurrent,
                  {
                    ...existing,
                    minimized: false,
                    unreadCount: existing.unreadCount + 1,
                  },
                ]);
              }

              return enforceChatLimit([
                ...prev,
                {
                  orderId: order.id,
                  minimized: false,
                  unreadCount: 1,
                  manual: false,
                },
              ]);
            });
          }
        )
        .subscribe();

      chatChannelsRef.current.push(channel);
    });

    return () => {
      active = false;

      chatChannelsRef.current.forEach((channel) => {
        supabase.removeChannel(channel);
      });

      chatChannelsRef.current = [];
    };
  }, [
    watchedOrderIdsKey,
    watchedOrders,
    addToast,
    pulseOrder,
    enforceChatLimit,
  ]);

  useEffect(() => {
    setOpenChats((prev) => prev.filter((chat) => orderMap[chat.orderId]));
  }, [orderMap]);

  useEffect(() => {
    return () => {
      Object.values(highlightTimeoutsRef.current).forEach((timeoutId) => {
        clearTimeout(timeoutId);
      });

      chatChannelsRef.current.forEach((channel) => {
        supabase.removeChannel(channel);
      });

      chatChannelsRef.current = [];
    };
  }, []);

  const visibleChats = openChats.filter((chat) => orderMap[chat.orderId]);

  return (
    <>
      <AdminContentHeader
        kicker="Painel administrativo"
        title="Gestão de pedidos"
        subtitle="Acompanhe os pedidos da pizzaria, filtre por etapa e atualize o andamento em tempo real."
      />

      <section className={styles.content}>
        <div className={styles.container}>
          {message ? (
            <p className={styles.pageMessage} role="status">
              {message}
            </p>
          ) : null}

          <div className={styles.statsGrid}>
            <article className={styles.statCard}>
              <span>Pedidos hoje</span>
              <strong>{stats.totalToday}</strong>
            </article>

            <article className={styles.statCard}>
              <span>Aguardando</span>
              <strong>{stats.pending}</strong>
            </article>

            <article className={styles.statCard}>
              <span>Em preparo</span>
              <strong>{stats.preparing}</strong>
            </article>

            <article className={styles.statCard}>
              <span>Aguardando motoboy</span>
              <strong>{stats.waitingCourier}</strong>
            </article>

            <article className={styles.statCard}>
              <span>Saiu para entrega</span>
              <strong>{stats.outForDelivery}</strong>
            </article>

            <article className={styles.statCard}>
              <span>Entregues</span>
              <strong>{stats.delivered}</strong>
            </article>

            <article className={`${styles.statCard} ${styles.statCardWide}`}>
              <span>Faturamento do dia</span>
              <strong>
                {new Intl.NumberFormat("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                }).format(stats.revenueToday)}
              </strong>
            </article>
          </div>

          <div className={styles.toolbar}>
            <AdminFilters
              filters={FILTER_OPTIONS}
              statusFilter={statusFilter}
              onChangeFilter={setStatusFilter}
            />
          </div>

          <section className={styles.ordersSection}>
            {loading ? (
              <div className={styles.emptyState}>
                <p>Carregando pedidos...</p>
              </div>
            ) : !filteredOrders.length ? (
              <div className={styles.emptyState}>
                <p>Nenhum pedido encontrado para este filtro.</p>
              </div>
            ) : (
              <div className={styles.ordersList}>
                {filteredOrders.map((order) => {
                  const chatState = openChats.find(
                    (chat) => chat.orderId === order.id
                  );

                  return (
                    <AdminOrderCard
                      key={order.id}
                      order={order}
                      updatingOrderId={updatingOrderId}
                      onUpdateStatus={handleUpdateOrderStatus}
                      onOpenChat={openChatForOrder}
                      unreadCount={chatState?.unreadCount || 0}
                      isHighlighted={highlightedOrderIds[order.id] === true}
                      registerOrderRef={registerOrderRef}
                      focusRequestToken={focusRequestByOrderId[order.id] || 0}
                    />
                  );
                })}
              </div>
            )}
          </section>
        </div>
      </section>

      {visibleChats.length > 0 ? (
        <div className={styles.adminFloatingChatsDock}>
          {visibleChats.map((chat) => {
            const order = orderMap[chat.orderId];
            if (!order) return null;

            return (
              <AdminFloatingOrderChat
                key={chat.orderId}
                orderId={chat.orderId}
                customerName={order.customer_name}
                unreadCount={chat.unreadCount}
                minimized={chat.minimized}
                onClose={closeChat}
                onToggleMinimize={toggleMinimizeChat}
                onGoToOrder={focusOrder}
                onMarkAsRead={markChatAsRead}
              />
            );
          })}
        </div>
      ) : null}

      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </>
  );
}