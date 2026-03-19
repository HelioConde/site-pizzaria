import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "../../../lib/supabase";
import AdminContentHeader from "../components/AdminContentHeader";
import styles from "../Admin.module.css";

const PERIOD_FILTER = {
  ALL: "all",
  TODAY: "today",
  LAST_7_DAYS: "last_7_days",
  LAST_30_DAYS: "last_30_days",
};

function formatPrice(value) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(Number(value || 0));
}

function formatDate(value) {
  if (!value) return "Data não informada";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Data inválida";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}

function formatShortDate(value) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
  }).format(date);
}

function getPaymentMethodLabel(method) {
  const normalized = String(method || "").trim().toLowerCase();

  switch (normalized) {
    case "dinheiro":
      return "Dinheiro";
    case "cartao_entrega":
      return "Cartão na entrega";
    case "pagamento_online":
      return "Pagamento online";
    default:
      return "Não informado";
  }
}

function normalizeOrderStatus(status) {
  return String(status || "").trim().toLowerCase();
}

function isCancelledOrder(status) {
  const normalized = normalizeOrderStatus(status);
  return (
    normalized === "cancelled" ||
    normalized === "canceled" ||
    normalized === "cancelado"
  );
}

function isDeliveredOrder(status) {
  const normalized = normalizeOrderStatus(status);
  return normalized === "delivered" || normalized === "entregue";
}

function isSameDay(dateA, dateB) {
  return (
    dateA.getDate() === dateB.getDate() &&
    dateA.getMonth() === dateB.getMonth() &&
    dateA.getFullYear() === dateB.getFullYear()
  );
}

function isWithinLastDays(value, days) {
  if (!value) return false;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return false;

  const now = new Date();
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - (days - 1));

  return date >= start && date <= now;
}

function filterOrdersByPeriod(orders, period) {
  if (period === PERIOD_FILTER.ALL) return orders;

  const now = new Date();

  if (period === PERIOD_FILTER.TODAY) {
    return orders.filter((order) => {
      if (!order.created_at) return false;

      const createdAt = new Date(order.created_at);
      if (Number.isNaN(createdAt.getTime())) return false;

      return isSameDay(createdAt, now);
    });
  }

  if (period === PERIOD_FILTER.LAST_7_DAYS) {
    return orders.filter((order) => isWithinLastDays(order.created_at, 7));
  }

  if (period === PERIOD_FILTER.LAST_30_DAYS) {
    return orders.filter((order) => isWithinLastDays(order.created_at, 30));
  }

  return orders;
}

function buildOrderIdsSet(orders) {
  return new Set((orders ?? []).map((order) => order.id));
}

export default function ReportsSection() {
  const [orders, setOrders] = useState([]);
  const [orderItems, setOrderItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [periodFilter, setPeriodFilter] = useState(PERIOD_FILTER.LAST_30_DAYS);
  const [search, setSearch] = useState("");

  const loadReports = useCallback(async () => {
    setLoading(true);

    try {
      const [
        { data: ordersData, error: ordersError },
        { data: itemsData, error: itemsError },
      ] = await Promise.all([
        supabase
          .from("orders")
          .select(`
            id,
            customer_name,
            total,
            payment_method,
            payment_status,
            order_status,
            created_at
          `)
          .order("created_at", { ascending: false }),
        supabase
          .from("order_items")
          .select(`
            id,
            order_id,
            name,
            quantity,
            unit_price
          `),
      ]);

      if (ordersError) throw ordersError;
      if (itemsError) throw itemsError;

      setOrders(Array.isArray(ordersData) ? ordersData : []);
      setOrderItems(Array.isArray(itemsData) ? itemsData : []);
      setMessage("");
    } catch (error) {
      console.error("Erro ao carregar relatórios:", error);
      setOrders([]);
      setOrderItems([]);
      setMessage("Não foi possível carregar os relatórios.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadReports();

    const ordersChannel = supabase
      .channel("admin-reports-orders")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "orders",
        },
        () => {
          loadReports();
        }
      )
      .subscribe();

    const itemsChannel = supabase
      .channel("admin-reports-items")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "order_items",
        },
        () => {
          loadReports();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(ordersChannel);
      supabase.removeChannel(itemsChannel);
    };
  }, [loadReports]);

  const filteredOrdersByPeriod = useMemo(() => {
    return filterOrdersByPeriod(orders, periodFilter);
  }, [orders, periodFilter]);

  const filteredOrderIds = useMemo(() => {
    return buildOrderIdsSet(filteredOrdersByPeriod);
  }, [filteredOrdersByPeriod]);

  const filteredItemsByPeriod = useMemo(() => {
    return orderItems.filter((item) => filteredOrderIds.has(item.order_id));
  }, [orderItems, filteredOrderIds]);

  const searchedOrders = useMemo(() => {
    const term = search.trim().toLowerCase();

    if (!term) return filteredOrdersByPeriod;

    return filteredOrdersByPeriod.filter((order) => {
      const id = String(order.id || "").toLowerCase();
      const shortId = String(order.id || "").slice(0, 8).toLowerCase();
      const customer = String(order.customer_name || "").toLowerCase();
      const method = getPaymentMethodLabel(order.payment_method).toLowerCase();
      const status = normalizeOrderStatus(order.order_status);

      return (
        id.includes(term) ||
        shortId.includes(term) ||
        customer.includes(term) ||
        method.includes(term) ||
        status.includes(term)
      );
    });
  }, [filteredOrdersByPeriod, search]);

  const searchedOrderIds = useMemo(() => {
    return buildOrderIdsSet(searchedOrders);
  }, [searchedOrders]);

  const searchedItems = useMemo(() => {
    return filteredItemsByPeriod.filter((item) => searchedOrderIds.has(item.order_id));
  }, [filteredItemsByPeriod, searchedOrderIds]);

  const stats = useMemo(() => {
    const validOrders = searchedOrders.filter(
      (order) => !isCancelledOrder(order.order_status)
    );

    const deliveredOrders = searchedOrders.filter((order) =>
      isDeliveredOrder(order.order_status)
    );

    const cancelledOrders = searchedOrders.filter((order) =>
      isCancelledOrder(order.order_status)
    );

    const totalRevenue = validOrders.reduce(
      (acc, order) => acc + Number(order.total || 0),
      0
    );

    const ticketAverage = validOrders.length
      ? totalRevenue / validOrders.length
      : 0;

    const cancellationRate = searchedOrders.length
      ? (cancelledOrders.length / searchedOrders.length) * 100
      : 0;

    return {
      totalOrders: searchedOrders.length,
      deliveredOrders: deliveredOrders.length,
      cancelledOrders: cancelledOrders.length,
      totalRevenue,
      ticketAverage,
      cancellationRate,
    };
  }, [searchedOrders]);

  const paymentMethodTotals = useMemo(() => {
    const grouped = searchedOrders.reduce((acc, order) => {
      const method = getPaymentMethodLabel(order.payment_method);

      if (!acc[method]) {
        acc[method] = {
          method,
          orders: 0,
          revenue: 0,
        };
      }

      acc[method].orders += 1;

      if (!isCancelledOrder(order.order_status)) {
        acc[method].revenue += Number(order.total || 0);
      }

      return acc;
    }, {});

    return Object.values(grouped).sort((a, b) => b.revenue - a.revenue);
  }, [searchedOrders]);

  const topProducts = useMemo(() => {
    const grouped = searchedItems.reduce((acc, item) => {
      const name = String(item.name || "").trim() || "Produto sem nome";

      if (!acc[name]) {
        acc[name] = {
          name,
          quantity: 0,
          revenue: 0,
        };
      }

      const quantity = Number(item.quantity || 0);
      const unitPrice = Number(item.unit_price || 0);

      acc[name].quantity += quantity;
      acc[name].revenue += quantity * unitPrice;

      return acc;
    }, {});

    return Object.values(grouped)
      .sort((a, b) => b.quantity - a.quantity || b.revenue - a.revenue)
      .slice(0, 8);
  }, [searchedItems]);

  const topCustomers = useMemo(() => {
    const grouped = searchedOrders.reduce((acc, order) => {
      const customerName =
        String(order.customer_name || "").trim() || "Cliente sem nome";

      if (!acc[customerName]) {
        acc[customerName] = {
          name: customerName,
          orders: 0,
          totalSpent: 0,
        };
      }

      acc[customerName].orders += 1;

      if (!isCancelledOrder(order.order_status)) {
        acc[customerName].totalSpent += Number(order.total || 0);
      }

      return acc;
    }, {});

    return Object.values(grouped)
      .sort((a, b) => b.orders - a.orders || b.totalSpent - a.totalSpent)
      .slice(0, 8);
  }, [searchedOrders]);

  const revenueByDay = useMemo(() => {
    const grouped = searchedOrders.reduce((acc, order) => {
      if (isCancelledOrder(order.order_status)) return acc;
      if (!order.created_at) return acc;

      const date = new Date(order.created_at);
      if (Number.isNaN(date.getTime())) return acc;

      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
        2,
        "0"
      )}-${String(date.getDate()).padStart(2, "0")}`;

      if (!acc[key]) {
        acc[key] = {
          key,
          label: formatShortDate(order.created_at),
          orders: 0,
          revenue: 0,
        };
      }

      acc[key].orders += 1;
      acc[key].revenue += Number(order.total || 0);

      return acc;
    }, {});

    return Object.values(grouped)
      .sort((a, b) => a.key.localeCompare(b.key))
      .slice(-10);
  }, [searchedOrders]);

  const latestOrders = useMemo(() => {
    return searchedOrders.slice(0, 8);
  }, [searchedOrders]);

  return (
    <>
      <AdminContentHeader
        kicker="Business Intelligence"
        title="Relatórios"
        subtitle="Acompanhe indicadores da operação, vendas, produtos mais pedidos e clientes com maior recorrência."
      />

      <section className={styles.content}>
        <div className={styles.container}>
          {message ? (
            <p className={styles.pageMessage} role="status">
              {message}
            </p>
          ) : null}

          {loading ? (
            <div className={styles.emptyState}>
              <p>Carregando relatórios...</p>
            </div>
          ) : (
            <>
              <div className={styles.toolbar}>
                <div className={styles.filterGroup}>
                  <button
                    type="button"
                    className={`${styles.filterButton} ${
                      periodFilter === PERIOD_FILTER.ALL
                        ? styles.filterButtonActive
                        : ""
                    }`}
                    onClick={() => setPeriodFilter(PERIOD_FILTER.ALL)}
                  >
                    Tudo
                  </button>

                  <button
                    type="button"
                    className={`${styles.filterButton} ${
                      periodFilter === PERIOD_FILTER.TODAY
                        ? styles.filterButtonActive
                        : ""
                    }`}
                    onClick={() => setPeriodFilter(PERIOD_FILTER.TODAY)}
                  >
                    Hoje
                  </button>

                  <button
                    type="button"
                    className={`${styles.filterButton} ${
                      periodFilter === PERIOD_FILTER.LAST_7_DAYS
                        ? styles.filterButtonActive
                        : ""
                    }`}
                    onClick={() => setPeriodFilter(PERIOD_FILTER.LAST_7_DAYS)}
                  >
                    7 dias
                  </button>

                  <button
                    type="button"
                    className={`${styles.filterButton} ${
                      periodFilter === PERIOD_FILTER.LAST_30_DAYS
                        ? styles.filterButtonActive
                        : ""
                    }`}
                    onClick={() => setPeriodFilter(PERIOD_FILTER.LAST_30_DAYS)}
                  >
                    30 dias
                  </button>
                </div>
              </div>

              <div className={styles.customerSearchBar}>
                <input
                  type="text"
                  className={styles.customerSearchInput}
                  placeholder="Buscar por cliente, ID, método ou status"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>

              <div className={styles.statsGrid}>
                <article className={styles.statCard}>
                  <span>Pedidos totais</span>
                  <strong>{stats.totalOrders}</strong>
                </article>

                <article className={styles.statCard}>
                  <span>Entregues</span>
                  <strong>{stats.deliveredOrders}</strong>
                </article>

                <article className={styles.statCard}>
                  <span>Cancelados</span>
                  <strong>{stats.cancelledOrders}</strong>
                </article>

                <article className={styles.statCard}>
                  <span>Ticket médio</span>
                  <strong>{formatPrice(stats.ticketAverage)}</strong>
                </article>

                <article className={styles.statCard}>
                  <span>Taxa de cancelamento</span>
                  <strong>{stats.cancellationRate.toFixed(1)}%</strong>
                </article>

                <article className={`${styles.statCard} ${styles.statCardWide}`}>
                  <span>Faturamento total</span>
                  <strong>{formatPrice(stats.totalRevenue)}</strong>
                </article>
              </div>

              <div className={styles.reportGrid}>
                <article className={styles.reportCard}>
                  <div className={styles.reportCardHeader}>
                    <h3 className={styles.reportCardTitle}>
                      Faturamento por dia
                    </h3>
                    <span className={styles.reportCardSubtitle}>
                      Últimos 10 dias com venda
                    </span>
                  </div>

                  {!revenueByDay.length ? (
                    <div className={styles.emptyState}>
                      <p>Nenhum dado encontrado.</p>
                    </div>
                  ) : (
                    <div className={styles.reportList}>
                      {revenueByDay.map((item) => (
                        <div key={item.key} className={styles.reportListRow}>
                          <div>
                            <strong>{item.label}</strong>
                            <span>{item.orders} pedido(s)</span>
                          </div>

                          <strong>{formatPrice(item.revenue)}</strong>
                        </div>
                      ))}
                    </div>
                  )}
                </article>

                <article className={styles.reportCard}>
                  <div className={styles.reportCardHeader}>
                    <h3 className={styles.reportCardTitle}>
                      Métodos de pagamento
                    </h3>
                    <span className={styles.reportCardSubtitle}>
                      Volume por método
                    </span>
                  </div>

                  {!paymentMethodTotals.length ? (
                    <div className={styles.emptyState}>
                      <p>Nenhum dado encontrado.</p>
                    </div>
                  ) : (
                    <div className={styles.reportList}>
                      {paymentMethodTotals.map((item) => (
                        <div key={item.method} className={styles.reportListRow}>
                          <div>
                            <strong>{item.method}</strong>
                            <span>{item.orders} pedido(s)</span>
                          </div>

                          <strong>{formatPrice(item.revenue)}</strong>
                        </div>
                      ))}
                    </div>
                  )}
                </article>

                <article className={styles.reportCard}>
                  <div className={styles.reportCardHeader}>
                    <h3 className={styles.reportCardTitle}>
                      Produtos mais vendidos
                    </h3>
                    <span className={styles.reportCardSubtitle}>
                      Ranking por quantidade
                    </span>
                  </div>

                  {!topProducts.length ? (
                    <div className={styles.emptyState}>
                      <p>Nenhum item encontrado.</p>
                    </div>
                  ) : (
                    <div className={styles.reportList}>
                      {topProducts.map((item) => (
                        <div key={item.name} className={styles.reportListRow}>
                          <div>
                            <strong>{item.name}</strong>
                            <span>{item.quantity} unidade(s)</span>
                          </div>

                          <strong>{formatPrice(item.revenue)}</strong>
                        </div>
                      ))}
                    </div>
                  )}
                </article>

                <article className={styles.reportCard}>
                  <div className={styles.reportCardHeader}>
                    <h3 className={styles.reportCardTitle}>
                      Clientes recorrentes
                    </h3>
                    <span className={styles.reportCardSubtitle}>
                      Mais pedidos no sistema
                    </span>
                  </div>

                  {!topCustomers.length ? (
                    <div className={styles.emptyState}>
                      <p>Nenhum cliente encontrado.</p>
                    </div>
                  ) : (
                    <div className={styles.reportList}>
                      {topCustomers.map((item) => (
                        <div key={item.name} className={styles.reportListRow}>
                          <div>
                            <strong>{item.name}</strong>
                            <span>{item.orders} pedido(s)</span>
                          </div>

                          <strong>{formatPrice(item.totalSpent)}</strong>
                        </div>
                      ))}
                    </div>
                  )}
                </article>

                <article className={styles.reportCard}>
                  <div className={styles.reportCardHeader}>
                    <h3 className={styles.reportCardTitle}>Últimos pedidos</h3>
                    <span className={styles.reportCardSubtitle}>
                      Visão rápida das vendas recentes
                    </span>
                  </div>

                  {!latestOrders.length ? (
                    <div className={styles.emptyState}>
                      <p>Nenhum pedido encontrado.</p>
                    </div>
                  ) : (
                    <div className={styles.reportList}>
                      {latestOrders.map((order) => (
                        <div key={order.id} className={styles.reportListRow}>
                          <div>
                            <strong>
                              #{String(order.id).slice(0, 8)} •{" "}
                              {order.customer_name || "Cliente sem nome"}
                            </strong>
                            <span>
                              {formatDate(order.created_at)} •{" "}
                              {getPaymentMethodLabel(order.payment_method)}
                            </span>
                          </div>

                          <strong>{formatPrice(order.total)}</strong>
                        </div>
                      ))}
                    </div>
                  )}
                </article>
              </div>
            </>
          )}
        </div>
      </section>
    </>
  );
}