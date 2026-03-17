import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import styles from "./PaymentSuccess.module.css";

function formatPrice(value) {
  if (value == null) return null;

  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(Number(value) || 0);
}

function formatPhone(value) {
  const digits = String(value || "").replace(/\D/g, "");

  if (!digits) return "";

  if (digits.length === 11) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  }

  if (digits.length === 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }

  return digits;
}

export default function PaymentSuccess() {
  const [searchParams] = useSearchParams();

  const orderId = searchParams.get("order_id");

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadOrder() {
      if (!orderId) {
        setLoading(false);
        return;
      }

      const { data } = await supabase
        .from("orders")
        .select("*")
        .eq("id", orderId)
        .single();

      setOrder(data);
      setLoading(false);
    }

    loadOrder();
  }, [orderId]);

  const shortOrderId = useMemo(() => {
    if (!orderId) return "";
    return orderId.slice(0, 8).toUpperCase();
  }, [orderId]);

  const addressLine = useMemo(() => {
    if (!order) return "";
    return `${order.delivery_address}, ${order.delivery_number}`;
  }, [order]);

  const regionLine = useMemo(() => {
    if (!order) return "";
    return `${order.delivery_district} • ${order.delivery_city} - ${order.delivery_state}`;
  }, [order]);

  if (loading) {
    return (
      <main className={styles.page}>
        <div className={styles.container}>Carregando pedido...</div>
      </main>
    );
  }

  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <section className={styles.card}>
          <span className={styles.kicker}>Pedido confirmado</span>

          <div className={styles.header}>
            <div className={styles.icon}>✓</div>

            <div>
              <h1 className={styles.title}>Pedido confirmado</h1>
              <p className={styles.subtitle}>
                Pagamento com cartão na entrega.
              </p>
            </div>
          </div>

          {/* resumo */}
          <div className={styles.summary}>
            <div className={styles.summaryItem}>
              <span className={styles.summaryLabel}>Pedido</span>
              <span className={styles.summaryValue}>#{shortOrderId}</span>
            </div>

            <div className={styles.summaryItem}>
              <span className={styles.summaryLabel}>Total</span>
              <span className={styles.summaryValue}>{formatPrice(order?.total)}</span>
            </div>

            <div className={styles.summaryItem}>
              <span className={styles.summaryLabel}>Pagamento</span>
              <span className={styles.summaryValue}>Cartão na entrega</span>
            </div>
          </div>

          {/* entrega */}
          <div className={styles.box}>
            <h2 className={styles.sectionTitle}>Entrega</h2>

            <div className={styles.grid}>
              <div className={styles.item}>
                <span className={styles.label}>Cliente</span>
                <p>{order?.customer_name}</p>
              </div>

              <div className={styles.item}>
                <span className={styles.label}>Telefone</span>
                <p>{formatPhone(order?.customer_phone)}</p>
              </div>

              <div className={styles.item}>
                <span className={styles.label}>Endereço</span>
                <p>{addressLine}</p>
              </div>

              <div className={styles.item}>
                <span className={styles.label}>Região</span>
                <p>{regionLine}</p>
              </div>
            </div>
          </div>

          {/* próximo passo */}
          <div className={styles.box}>
            <h2 className={styles.sectionTitle}>Próximo passo</h2>

            <div className={styles.status}>
              <span>
                <strong>Status:</strong> Na entrega
              </span>

              <span>
                <strong>Tempo estimado:</strong> 35–45 min
              </span>
            </div>

            <p className={styles.text}>
              Agora é só aguardar o preparo e a entrega.
            </p>

            <p className={styles.tip}>
              Você pode acompanhar o andamento pela sua conta.
            </p>
          </div>

          <div className={styles.actions}>
            <Link to="/menu" className={styles.secondary}>
              Voltar ao cardápio
            </Link>

            <Link to="/account" className={styles.primary}>
              Acompanhar pedido
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}