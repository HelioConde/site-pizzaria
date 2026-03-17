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

function normalizePaymentStatus(status) {
  return String(status || "").trim().toLowerCase();
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

function getPaymentStatusLabel(status) {
  const normalized = normalizePaymentStatus(status);

  switch (normalized) {
    case "paid":
      return "Pago";
    case "delivery_payment":
      return "Pagamento na entrega";
    case "pending":
      return "Pendente";
    case "cancelled":
      return "Cancelado";
    default:
      return "Não definido";
  }
}

function getPaymentStatusClass(status, styles) {
  const normalized = normalizePaymentStatus(status);

  switch (normalized) {
    case "paid":
      return `${styles.paymentBadge} ${styles.paymentPaid}`;
    case "cancelled":
      return `${styles.paymentBadge} ${styles.paymentCancelled}`;
    case "delivery_payment":
      return `${styles.paymentBadge} ${styles.paymentDelivery}`;
    default:
      return `${styles.paymentBadge} ${styles.paymentPending}`;
  }
}

function getOrderStatusLabel(status) {
  const normalized = String(status || "").trim().toLowerCase();

  switch (normalized) {
    case "pending":
      return "Aguardando";
    case "preparing":
      return "Em preparo";
    case "waiting_courier":
      return "Aguardando motoboy";
    case "delivery":
      return "Saiu para entrega";
    case "delivered":
      return "Entregue";
    case "cancelled":
      return "Cancelado";
    default:
      return "Não informado";
  }
}

function getOrderStatusClass(status, styles) {
  const normalized = String(status || "").trim().toLowerCase();

  switch (normalized) {
    case "pending":
      return `${styles.statusBadge} ${styles.statusBadgePending}`;
    case "preparing":
      return `${styles.statusBadge} ${styles.statusBadgePreparing}`;
    case "waiting_courier":
      return `${styles.statusBadge} ${styles.statusBadgeWaitingCourier}`;
    case "delivery":
      return `${styles.statusBadge} ${styles.statusBadgeDelivery}`;
    case "delivered":
      return `${styles.statusBadge} ${styles.statusBadgeDelivered}`;
    case "cancelled":
      return `${styles.statusBadge} ${styles.statusBadgeCanceled}`;
    default:
      return `${styles.statusBadge} ${styles.statusBadgeDefault}`;
  }
}

export default function PaymentsSection() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");

  async function loadPayments() {
    setLoading(true);

    try {
      const { data, error } = await supabase
        .from("orders")
        .select(`
          id,
          customer_name,
          customer_phone,
          payment_method,
          payment_status,
          total,
          created_at,
          order_status
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;

      setPayments(data ?? []);
      setMessage("");
    } catch (error) {
      console.error("Erro ao carregar pagamentos:", error);
      setPayments([]);
      setMessage("Não foi possível carregar os pagamentos.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPayments();

    const channel = supabase
      .channel("admin-payments")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "orders",
        },
        loadPayments
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const filteredPayments = useMemo(() => {
    let result = payments;

    if (filter !== "all") {
      result = result.filter(
        (payment) => normalizePaymentStatus(payment.payment_status) === filter
      );
    }

    const term = search.trim().toLowerCase();

    if (!term) return result;

    return result.filter((payment) => {
      const id = String(payment.id || "").toLowerCase();
      const name = String(payment.customer_name || "").toLowerCase();
      const phone = String(payment.customer_phone || "").toLowerCase();
      const method = getPaymentMethodLabel(payment.payment_method).toLowerCase();
      const paymentStatus = getPaymentStatusLabel(payment.payment_status).toLowerCase();
      const orderStatus = getOrderStatusLabel(payment.order_status).toLowerCase();

      return (
        id.includes(term) ||
        name.includes(term) ||
        phone.includes(term) ||
        method.includes(term) ||
        paymentStatus.includes(term) ||
        orderStatus.includes(term)
      );
    });
  }, [payments, filter, search]);

  const stats = useMemo(() => {
    return {
      total: payments.length,
      paid: payments.filter(
        (payment) => normalizePaymentStatus(payment.payment_status) === "paid"
      ).length,
      pending: payments.filter(
        (payment) => normalizePaymentStatus(payment.payment_status) === "pending"
      ).length,
      deliveryPayment: payments.filter(
        (payment) =>
          normalizePaymentStatus(payment.payment_status) === "delivery_payment"
      ).length,
      cancelled: payments.filter(
        (payment) => normalizePaymentStatus(payment.payment_status) === "cancelled"
      ).length,
      totalRevenue: payments
        .filter((payment) => {
          const status = normalizePaymentStatus(payment.payment_status);
          return status === "paid" || status === "delivery_payment";
        })
        .reduce((acc, payment) => acc + Number(payment.total || 0), 0),
    };
  }, [payments]);

  return (
    <>
      <AdminContentHeader
        kicker="Financeiro"
        title="Pagamentos"
        subtitle="Acompanhe o status dos pagamentos, visualize pendências e tenha controle financeiro da operação."
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
              <span>Total</span>
              <strong>{stats.total}</strong>
            </article>

            <article className={styles.statCard}>
              <span>Pagos</span>
              <strong>{stats.paid}</strong>
            </article>

            <article className={styles.statCard}>
              <span>Pendentes</span>
              <strong>{stats.pending}</strong>
            </article>

            <article className={styles.statCard}>
              <span>Cancelados</span>
              <strong>{stats.cancelled}</strong>
            </article>

            <article className={`${styles.statCard} ${styles.statCardWide}`}>
              <span>Total recebido</span>
              <strong>{formatPrice(stats.totalRevenue)}</strong>
            </article>
          </div>

          <div className={styles.toolbar}>
            <div className={styles.filterGroup}>
              <button
                type="button"
                className={`${styles.filterButton} ${filter === "all" ? styles.filterButtonActive : ""
                  }`}
                onClick={() => setFilter("all")}
              >
                Todos
              </button>

              <button
                type="button"
                className={`${styles.filterButton} ${filter === "paid" ? styles.filterButtonActive : ""
                  }`}
                onClick={() => setFilter("paid")}
              >
                Pagos
              </button>

              <button
                type="button"
                className={`${styles.filterButton} ${filter === "pending" ? styles.filterButtonActive : ""
                  }`}
                onClick={() => setFilter("pending")}
              >
                Pendentes
              </button>

              <button
                type="button"
                className={`${styles.filterButton} ${filter === "delivery_payment" ? styles.filterButtonActive : ""
                  }`}
                onClick={() => setFilter("delivery_payment")}
              >
                Na entrega
              </button>

              <button
                type="button"
                className={`${styles.filterButton} ${filter === "cancelled" ? styles.filterButtonActive : ""
                  }`}
                onClick={() => setFilter("cancelled")}
              >
                Cancelados
              </button>
            </div>
          </div>

          <div className={styles.customerSearchBar}>
            <input
              type="text"
              className={styles.customerSearchInput}
              placeholder="Buscar por cliente, telefone, método ou ID do pedido"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {loading ? (
            <div className={styles.emptyState}>
              <p>Carregando pagamentos...</p>
            </div>
          ) : !filteredPayments.length ? (
            <div className={styles.emptyState}>
              <p>Nenhum pagamento encontrado.</p>
            </div>
          ) : (
            <div className={styles.paymentGrid}>
              {filteredPayments.map((payment) => (
                <article key={payment.id} className={styles.paymentCard}>
                  <div className={styles.paymentHeader}>
                    <div>
                      <h3 className={styles.paymentTitle}>
                        Pedido #{String(payment.id).slice(0, 8)}
                      </h3>
                      <p className={styles.paymentSubtext}>
                        {payment.customer_name || "Cliente não informado"}
                      </p>
                    </div>

                    <span
                      className={getPaymentStatusClass(
                        payment.payment_status,
                        styles
                      )}
                    >
                      {getPaymentStatusLabel(payment.payment_status)}
                    </span>
                  </div>

                  <div className={styles.paymentInfoGrid}>
                    <div className={styles.paymentInfoBlock}>
                      <span className={styles.paymentInfoLabel}>Método</span>
                      <strong>
                        {getPaymentMethodLabel(payment.payment_method)}
                      </strong>
                    </div>

                    <div className={styles.paymentInfoBlock}>
                      <span className={styles.paymentInfoLabel}>Valor</span>
                      <strong>{formatPrice(payment.total)}</strong>
                    </div>

                    <div className={styles.paymentInfoBlock}>
                      <span className={styles.paymentInfoLabel}>Telefone</span>
                      <strong>{payment.customer_phone || "Não informado"}</strong>
                    </div>

                    <div className={styles.paymentInfoBlock}>
                      <span className={styles.paymentInfoLabel}>Data</span>
                      <strong>{formatDate(payment.created_at)}</strong>
                    </div>
                    <div
                      className={`${styles.paymentInfoBlock} ${styles.paymentInfoBlockWide}`}
                    >
                      <span className={styles.paymentInfoLabel}>
                        Status do pedido
                      </span>

                      <div className={styles.paymentStatusWrap}>
                        <span className={getOrderStatusClass(payment.order_status, styles)}>
                          {getOrderStatusLabel(payment.order_status)}
                        </span>
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}