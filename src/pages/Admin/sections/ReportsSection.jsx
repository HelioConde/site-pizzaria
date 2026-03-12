import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../../lib/supabase";
import AdminContentHeader from "../components/AdminContentHeader";
import styles from "../Admin.module.css";

function formatPrice(value) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(Number(value || 0));
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

export default function ReportsSection() {
  const [orders, setOrders] = useState([]);
  const [orderItems, setOrderItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  async function loadReports() {
    setLoading(true);

    try {
      const [{ data: ordersData, error: ordersError }, { data: itemsData, error: itemsError }] =
        await Promise.all([
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

      setOrders(ordersData ?? []);
      setOrderItems(itemsData ?? []);
      setMessage("");
    } catch (error) {
      console.error("Erro ao carregar relatórios:", error);
      setOrders([]);
      setOrderItems([]);
      setMessage("Não foi possível carregar os relatórios.");
    } finally {
      setLoading(false);
    }
  }

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
        loadReports
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
        loadReports
      )
      .subscribe();

    return () => {
      supabase.removeChannel(ordersChannel);
      supabase.removeChannel(itemsChannel);
    };
  }, []);

  const stats = useMemo(() => {
    const validOrders = orders.filter(
      (order) => String(order.order_status || "").trim().toLowerCase() !== "cancelled"
    );

    const deliveredOrders = orders.filter((order) =>
      ["delivered", "entregue"].includes(
        String(order.order_status || "").trim().toLowerCase()
      )
    );

    const cancelledOrders = orders.filter((order) =>
      ["cancelled", "canceled", "cancelado"].includes(
        String(order.order_status || "").trim().toLowerCase()
      )
    );

    const totalRevenue = validOrders.reduce(
      (acc, order) => acc + Number(order.total || 0),
      0
    );

    const ticketAverage = validOrders.length
      ? totalRevenue / validOrders.length
      : 0;

    return {
      totalOrders: orders.length,
      deliveredOrders: deliveredOrders.length,
      cancelledOrders: cancelledOrders.length,
      totalRevenue,
      ticketAverage,
    };
  }, [orders]);

  const paymentMethodTotals = useMemo(() => {
    const grouped = orders.reduce((acc, order) => {
      const method = getPaymentMethodLabel(order.payment_method);

      if (!acc[method]) {
        acc[method] = {
          method,
          orders: 0,
          revenue: 0,
        };
      }

      const isCancelled = ["cancelled", "canceled", "cancelado"].includes(
        String(order.order_status || "").trim().toLowerCase()
      );

      acc[method].orders += 1;

      if (!isCancelled) {
        acc[method].revenue += Number(order.total || 0);
      }

      return acc;
    }, {});

    return Object.values(grouped).sort((a, b) => b.revenue - a.revenue);
  }, [orders]);

  const topProducts = useMemo(() => {
    const grouped = orderItems.reduce((acc, item) => {
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
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 8);
  }, [orderItems]);

  const topCustomers = useMemo(() => {
    const grouped = orders.reduce((acc, order) => {
      const customerName =
        String(order.customer_name || "").trim() || "Cliente sem nome";

      if (!acc[customerName]) {
        acc[customerName] = {
          name: customerName,
          orders: 0,
          totalSpent: 0,
        };
      }

      const isCancelled = ["cancelled", "canceled", "cancelado"].includes(
        String(order.order_status || "").trim().toLowerCase()
      );

      acc[customerName].orders += 1;

      if (!isCancelled) {
        acc[customerName].totalSpent += Number(order.total || 0);
      }

      return acc;
    }, {});

    return Object.values(grouped)
      .sort((a, b) => b.orders - a.orders || b.totalSpent - a.totalSpent)
      .slice(0, 8);
  }, [orders]);

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

                <article className={`${styles.statCard} ${styles.statCardWide}`}>
                  <span>Faturamento total</span>
                  <strong>{formatPrice(stats.totalRevenue)}</strong>
                </article>
              </div>

              <div className={styles.reportGrid}>
                <article className={styles.reportCard}>
                  <div className={styles.reportCardHeader}>
                    <h3 className={styles.reportCardTitle}>Métodos de pagamento</h3>
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
                    <h3 className={styles.reportCardTitle}>Produtos mais vendidos</h3>
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
                    <h3 className={styles.reportCardTitle}>Clientes recorrentes</h3>
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
              </div>
            </>
          )}
        </div>
      </section>
    </>
  );
}