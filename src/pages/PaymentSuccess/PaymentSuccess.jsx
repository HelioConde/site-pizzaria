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

function buildAddressLine(order) {
  if (!order) return "";

  return [order.delivery_address, order.delivery_number]
    .map((value) => String(value || "").trim())
    .filter(Boolean)
    .join(", ");
}

function buildRegionLine(order) {
  if (!order) return "";

  const cityState = [order.delivery_city, order.delivery_state]
    .map((value) => String(value || "").trim())
    .filter(Boolean)
    .join(" - ");

  return [order.delivery_district, cityState]
    .map((value) => String(value || "").trim())
    .filter(Boolean)
    .join(" • ");
}

export default function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const orderIdFromUrl = searchParams.get("order_id");

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function loadOrder() {
      try {
        setLoading(true);
        setMessage("");

        if (!orderIdFromUrl) {
          setMessage("Pedido não encontrado na URL.");
          return;
        }

        const { data, error } = await supabase
          .from("orders")
          .select("*")
          .eq("id", orderIdFromUrl)
          .single();

        if (error) {
          console.error("Erro ao carregar pedido:", error);
          setMessage("Não foi possível carregar os dados do pedido.");
          return;
        }

        setOrder(data);
      } catch (error) {
        console.error("Erro na página de sucesso:", error);
        setMessage("Ocorreu um erro ao carregar os dados do pedido.");
      } finally {
        setLoading(false);
      }
    }

    loadOrder();
  }, [orderIdFromUrl]);

  const shortOrderId = useMemo(() => {
    if (!order?.id) return "";
    return String(order.id).slice(0, 8).toUpperCase();
  }, [order]);

  const addressLine = useMemo(() => buildAddressLine(order), [order]);
  const regionLine = useMemo(() => buildRegionLine(order), [order]);

  const paymentLabel = useMemo(() => {
    if (!order) return "Não identificado";

    if (order.payment_method === PAYMENT_METHOD.ONLINE) {
      return order.payment_status === PAYMENT_STATUS.PAID
        ? "Pagamento online aprovado"
        : "Pagamento online aguardando confirmação";
    }

    if (order.payment_method === PAYMENT_METHOD.CARD_ON_DELIVERY) {
      return "Cartão na entrega";
    }

    if (order.payment_method === PAYMENT_METHOD.CASH) {
      return "Dinheiro na entrega";
    }

    return "Não identificado";
  }, [order]);

  const subtitleText = useMemo(() => {
    if (!order) {
      return "Seu pedido foi recebido com sucesso.";
    }

    if (order.payment_method === PAYMENT_METHOD.ONLINE) {
      return order.payment_status === PAYMENT_STATUS.PAID
        ? "Pagamento online confirmado com sucesso."
        : "Pedido recebido. O pagamento ainda está aguardando confirmação.";
    }

    if (order.payment_method === PAYMENT_METHOD.CARD_ON_DELIVERY) {
      return "Pagamento com cartão na entrega.";
    }

    if (order.payment_method === PAYMENT_METHOD.CASH) {
      return "Pagamento em dinheiro na entrega.";
    }

    return "Seu pedido foi recebido com sucesso.";
  }, [order]);

  const statusText = useMemo(() => {
    if (!order) return "Aguardando";

    if (order.payment_method === PAYMENT_METHOD.ONLINE) {
      return order.payment_status === PAYMENT_STATUS.PAID
        ? "Pagamento aprovado"
        : "Aguardando confirmação";
    }

    return "Pagamento na entrega";
  }, [order]);

  const kickerText = useMemo(() => {
    if (!order) return "Pedido recebido";

    if (
      order.payment_method === PAYMENT_METHOD.ONLINE &&
      order.payment_status !== PAYMENT_STATUS.PAID
    ) {
      return "Pagamento em análise";
    }

    return "Pedido confirmado";
  }, [order]);

  const titleText = useMemo(() => {
    if (!order) return "Pedido recebido";

    if (
      order.payment_method === PAYMENT_METHOD.ONLINE &&
      order.payment_status !== PAYMENT_STATUS.PAID
    ) {
      return "Pedido recebido";
    }

    return "Pedido confirmado";
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
          <span className={styles.kicker}>{kickerText}</span>

          <div className={styles.header}>
            <div className={styles.icon}>
              {order?.payment_method === PAYMENT_METHOD.ONLINE &&
              order?.payment_status !== PAYMENT_STATUS.PAID
                ? "⏳"
                : "✓"}
            </div>

            <div>
              <h1 className={styles.title}>{titleText}</h1>
              <p className={styles.subtitle}>{subtitleText}</p>
            </div>
          </div>

          {message ? <p className={styles.tip}>{message}</p> : null}

          <div className={styles.summary}>
            <div className={styles.summaryItem}>
              <span className={styles.summaryLabel}>Pedido</span>
              <span className={styles.summaryValue}>
                {shortOrderId ? `#${shortOrderId}` : "-"}
              </span>
            </div>

            <div className={styles.summaryItem}>
              <span className={styles.summaryLabel}>Total</span>
              <span className={styles.summaryValue}>
                {formatPrice(order?.total)}
              </span>
            </div>

            <div className={styles.summaryItem}>
              <span className={styles.summaryLabel}>Pagamento</span>
              <span className={styles.summaryValue}>{paymentLabel}</span>
            </div>
          </div>

          <div className={styles.box}>
            <h2 className={styles.sectionTitle}>Entrega</h2>

            <div className={styles.grid}>
              <div className={styles.item}>
                <span className={styles.label}>Cliente</span>
                <p>{order?.customer_name || "Não informado"}</p>
              </div>

              <div className={styles.item}>
                <span className={styles.label}>Telefone</span>
                <p>{formatPhone(order?.customer_phone) || "Não informado"}</p>
              </div>

              <div className={styles.item}>
                <span className={styles.label}>Endereço</span>
                <p>{addressLine || "Não informado"}</p>
              </div>

              <div className={styles.item}>
                <span className={styles.label}>Região</span>
                <p>{regionLine || "Não informado"}</p>
              </div>

              {order?.delivery_complement ? (
                <div className={styles.item}>
                  <span className={styles.label}>Complemento</span>
                  <p>{order.delivery_complement}</p>
                </div>
              ) : null}

              {order?.delivery_reference ? (
                <div className={styles.item}>
                  <span className={styles.label}>Referência</span>
                  <p>{order.delivery_reference}</p>
                </div>
              ) : null}
            </div>
          </div>

          <div className={styles.box}>
            <h2 className={styles.sectionTitle}>Próximo passo</h2>

            <div className={styles.status}>
              <span>
                <strong>Status:</strong> {statusText}
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