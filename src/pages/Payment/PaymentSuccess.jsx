import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import styles from "./PaymentSuccess.module.css";

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

const STATUS_STEPS = [
  { key: "paid", label: "Pagamento aprovado" },
  { key: ORDER_STATUS.PENDING, label: "Aguardando" },
  { key: ORDER_STATUS.PREPARING, label: "Em preparo" },
  { key: ORDER_STATUS.DELIVERY, label: "Saiu para entrega" },
  { key: ORDER_STATUS.DELIVERED, label: "Entregue" },
];

function normalizeOrderStatus(value) {
  const raw = String(value || "").trim().toLowerCase();

  if (
    [
      "pending",
      "new",
      "novo",
      "confirmed",
      "confirmado",
      "awaiting",
      "aguardando",
    ].includes(raw)
  ) {
    return ORDER_STATUS.PENDING;
  }

  if (["preparing", "em_preparo", "preparo"].includes(raw)) {
    return ORDER_STATUS.PREPARING;
  }

  if (["delivery", "out_for_delivery", "saiu_para_entrega"].includes(raw)) {
    return ORDER_STATUS.DELIVERY;
  }

  if (["delivered", "entregue"].includes(raw)) {
    return ORDER_STATUS.DELIVERED;
  }

  if (["cancelled", "canceled", "cancelado"].includes(raw)) {
    return ORDER_STATUS.CANCELLED;
  }

  return ORDER_STATUS.PENDING;
}

function getStatusLabel(orderStatus, paymentStatus, paymentMethod) {
  const normalizedOrderStatus = normalizeOrderStatus(orderStatus);
  const normalizedPaymentStatus = String(paymentStatus || "").trim().toLowerCase();
  const normalizedPaymentMethod = String(paymentMethod || "").trim().toLowerCase();

  if (normalizedOrderStatus === ORDER_STATUS.CANCELLED) {
    return "Cancelado";
  }

  if (
    normalizedPaymentMethod === PAYMENT_METHOD.ONLINE &&
    normalizedPaymentStatus !== PAYMENT_STATUS.PAID
  ) {
    return "Pagamento pendente";
  }

  if (normalizedOrderStatus === ORDER_STATUS.PENDING) {
    return "Aguardando";
  }

  if (normalizedOrderStatus === ORDER_STATUS.PREPARING) {
    return "Em preparo";
  }

  if (normalizedOrderStatus === ORDER_STATUS.DELIVERY) {
    return "Saiu para entrega";
  }

  if (normalizedOrderStatus === ORDER_STATUS.DELIVERED) {
    return "Entregue";
  }

  return "Aguardando";
}

function getStatusText(orderStatus, paymentStatus, paymentMethod) {
  const normalizedOrderStatus = normalizeOrderStatus(orderStatus);
  const normalizedPaymentStatus = String(paymentStatus || "").trim().toLowerCase();
  const normalizedPaymentMethod = String(paymentMethod || "").trim().toLowerCase();

  if (normalizedOrderStatus === ORDER_STATUS.CANCELLED) {
    return "Este pedido foi cancelado.";
  }

  if (
    normalizedPaymentMethod === PAYMENT_METHOD.ONLINE &&
    normalizedPaymentStatus !== PAYMENT_STATUS.PAID
  ) {
    return "Estamos aguardando a confirmação do pagamento para continuar o atendimento do pedido.";
  }

  if (normalizedOrderStatus === ORDER_STATUS.PENDING) {
    return "Seu pedido foi recebido e está aguardando a próxima etapa.";
  }

  if (normalizedOrderStatus === ORDER_STATUS.PREPARING) {
    return "Nossa equipe já começou a preparar seu pedido.";
  }

  if (normalizedOrderStatus === ORDER_STATUS.DELIVERY) {
    return "Seu pedido saiu para entrega e está a caminho.";
  }

  if (normalizedOrderStatus === ORDER_STATUS.DELIVERED) {
    return "Seu pedido foi entregue com sucesso.";
  }

  return "Seu pedido foi recebido com sucesso.";
}

function getSummaryText(orderStatus, paymentStatus, paymentMethod) {
  const normalizedOrderStatus = normalizeOrderStatus(orderStatus);
  const normalizedPaymentStatus = String(paymentStatus || "").trim().toLowerCase();
  const normalizedPaymentMethod = String(paymentMethod || "").trim().toLowerCase();

  if (normalizedOrderStatus === ORDER_STATUS.CANCELLED) {
    return "O pedido foi cancelado. Caso tenha ocorrido algum problema, verifique sua conta ou fale com a loja.";
  }

  if (
    normalizedPaymentMethod === PAYMENT_METHOD.ONLINE &&
    normalizedPaymentStatus === PAYMENT_STATUS.PAID &&
    normalizedOrderStatus === ORDER_STATUS.PENDING
  ) {
    return "O pagamento foi confirmado e seu pedido está aguardando o início do preparo.";
  }

  if (
    normalizedPaymentMethod === PAYMENT_METHOD.ONLINE &&
    normalizedPaymentStatus !== PAYMENT_STATUS.PAID
  ) {
    return "Estamos aguardando a confirmação do pagamento online para prosseguir com o pedido.";
  }

  if (normalizedOrderStatus === ORDER_STATUS.PREPARING) {
    return "O pagamento foi confirmado e seu pedido já está sendo preparado. Em breve ele seguirá para entrega.";
  }

  if (normalizedOrderStatus === ORDER_STATUS.DELIVERY) {
    return "Seu pedido já saiu para entrega e em breve chegará ao endereço informado.";
  }

  if (normalizedOrderStatus === ORDER_STATUS.DELIVERED) {
    return "Seu pedido foi concluído e entregue com sucesso.";
  }

  return "Seu pedido foi confirmado com sucesso e está aguardando andamento.";
}

function buildTimeline(orderStatus, paymentStatus, paymentMethod) {
  const normalizedOrderStatus = normalizeOrderStatus(orderStatus);
  const normalizedPaymentStatus = String(paymentStatus || "").trim().toLowerCase();
  const normalizedPaymentMethod = String(paymentMethod || "").trim().toLowerCase();

  const isOnlinePayment = normalizedPaymentMethod === PAYMENT_METHOD.ONLINE;
  const isPaid = normalizedPaymentStatus === PAYMENT_STATUS.PAID;
  const isCancelled = normalizedOrderStatus === ORDER_STATUS.CANCELLED;

  if (isCancelled) {
    return [
      {
        key: ORDER_STATUS.CANCELLED,
        label: "Cancelado",
        done: true,
        current: true,
      },
    ];
  }

  if (isOnlinePayment && !isPaid) {
    return [
      {
        key: "payment_pending",
        label: "Pagamento pendente",
        done: true,
        current: true,
      },
      {
        key: ORDER_STATUS.PENDING,
        label: "Aguardando",
        done: false,
        current: false,
      },
      {
        key: ORDER_STATUS.PREPARING,
        label: "Em preparo",
        done: false,
        current: false,
      },
      {
        key: ORDER_STATUS.DELIVERY,
        label: "Saiu para entrega",
        done: false,
        current: false,
      },
      {
        key: ORDER_STATUS.DELIVERED,
        label: "Entregue",
        done: false,
        current: false,
      },
    ];
  }

  const orderStepIndexMap = {
    [ORDER_STATUS.PENDING]: 1,
    [ORDER_STATUS.PREPARING]: 2,
    [ORDER_STATUS.DELIVERY]: 3,
    [ORDER_STATUS.DELIVERED]: 4,
  };

  const currentStepIndex = orderStepIndexMap[normalizedOrderStatus] ?? 1;

  return STATUS_STEPS.map((step, index) => ({
    ...step,
    done: index <= currentStepIndex,
    current: index === currentStepIndex,
  }));
}

export default function PaymentSuccess() {
  const [searchParams] = useSearchParams();

  const rawOrderId = searchParams.get("order_id");
  const sessionId = searchParams.get("session_id");

  const orderId = useMemo(() => {
    if (!rawOrderId) return null;
    return rawOrderId.split("?")[0].trim();
  }, [rawOrderId]);

  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [order, setOrder] = useState(null);

  useEffect(() => {
    async function confirmOrderWithRpc() {
      console.log("========= PAYMENT SUCCESS RPC DEBUG =========");
      console.log("URL:", window.location.href);
      console.log("rawOrderId:", rawOrderId);
      console.log("orderId:", orderId);
      console.log("sessionId:", sessionId);

      if (!orderId) {
        setErrorMessage("Pedido não encontrado.");
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase.rpc(
          "confirm_online_order_payment",
          {
            p_order_id: orderId,
            p_session_id: sessionId || null,
          }
        );

        console.log("RPC data:", data);
        console.log("RPC error:", error);

        if (error) {
          throw error;
        }

        const resolvedOrder = Array.isArray(data) ? data[0] : data;

        if (!resolvedOrder) {
          throw new Error("A função SQL não retornou os dados do pedido.");
        }

        setOrder(resolvedOrder);
      } catch (error) {
        console.error("🔥 ERRO RPC COMPLETO:", error);
        setErrorMessage(
          error?.message || "Não foi possível carregar os dados do pedido."
        );
      } finally {
        setLoading(false);
      }
    }

    confirmOrderWithRpc();
  }, [orderId, sessionId, rawOrderId]);

  const timeline = useMemo(() => {
    if (!order) return [];
    return buildTimeline(
      order.order_status,
      order.payment_status,
      order.payment_method
    );
  }, [order]);

  const statusLabel = useMemo(() => {
    if (!order) return "Carregando";
    return getStatusLabel(
      order.order_status,
      order.payment_status,
      order.payment_method
    );
  }, [order]);

  const statusText = useMemo(() => {
    if (!order) return "";
    return getStatusText(
      order.order_status,
      order.payment_status,
      order.payment_method
    );
  }, [order]);

  const summaryText = useMemo(() => {
    if (!order) return "";
    return getSummaryText(
      order.order_status,
      order.payment_status,
      order.payment_method
    );
  }, [order]);

  const successTitle = useMemo(() => {
    if (!order) return "Carregando pedido";

    if (
      String(order.payment_method || "").toLowerCase() === PAYMENT_METHOD.ONLINE
    ) {
      return String(order.payment_status || "").toLowerCase() === PAYMENT_STATUS.PAID
        ? "Pagamento aprovado com sucesso"
        : "Pagamento recebido";
    }

    return "Pedido confirmado com sucesso";
  }, [order]);

  const subtitle = useMemo(() => {
    if (!order) {
      return "Estamos validando as informações do seu pedido.";
    }

    if (
      String(order.payment_method || "").toLowerCase() === PAYMENT_METHOD.ONLINE
    ) {
      if (
        String(order.payment_status || "").toLowerCase() === PAYMENT_STATUS.PAID
      ) {
        return (
          <>
            Seu pedido foi recebido pela <strong>Base Studio Pizzas</strong> e o
            pagamento já foi confirmado.
          </>
        );
      }

      return (
        <>
          Seu pedido foi recebido pela <strong>Base Studio Pizzas</strong> e
          estamos aguardando a confirmação do pagamento.
        </>
      );
    }

    return (
      <>
        Seu pedido foi recebido pela <strong>Base Studio Pizzas</strong> e está
        aguardando andamento.
      </>
    );
  }, [order]);

  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <section className={styles.card}>
          <span className={styles.kicker}>Pedido confirmado</span>

          <div className={styles.iconWrap}>
            <div className={styles.icon}>✓</div>
            <h1 className={styles.title}>
              {loading ? "Carregando pedido" : successTitle}
            </h1>
          </div>

          <p className={styles.subtitle}>
            {loading
              ? "Estamos validando as informações do seu pedido."
              : subtitle}
          </p>

          {errorMessage ? (
            <div className={styles.infoBox}>
              <h2 className={styles.sectionTitle}>Atenção</h2>
              <p className={styles.infoText}>{errorMessage}</p>
            </div>
          ) : null}

          {!errorMessage ? (
            <div className={styles.timelineBoxControl}>
              <div className={styles.statusHighlight}>
                <span className={styles.statusBadge}>Status atual</span>
                <strong className={styles.statusValue}>
                  {loading ? "Carregando..." : statusLabel}
                </strong>
                <p className={styles.statusText}>
                  {loading ? "Aguarde..." : statusText}
                </p>
                <span className={styles.estimate}>
                  Tempo estimado: 35–45 minutos
                </span>
              </div>

              <div className={styles.timelineBox}>
                <h2 className={styles.sectionTitle}>Acompanhamento do pedido</h2>

                <div className={styles.timeline}>
                  {loading ? (
                    <div className={styles.timelineItem}>
                      <div
                        className={`${styles.timelineMarker} ${styles.timelineMarkerCurrent}`}
                      />
                      <div className={styles.timelineContent}>
                        <p className={styles.timelineLabel}>
                          Carregando status do pedido...
                        </p>
                      </div>
                    </div>
                  ) : (
                    timeline.map((step) => (
                      <div key={step.key} className={styles.timelineItem}>
                        <div
                          className={`${styles.timelineMarker} ${
                            step.done ? styles.timelineMarkerDone : ""
                          } ${
                            step.current ? styles.timelineMarkerCurrent : ""
                          }`}
                        >
                          {step.done ? "✓" : ""}
                        </div>

                        <div className={styles.timelineContent}>
                          <p
                            className={`${styles.timelineLabel} ${
                              step.done ? styles.timelineLabelDone : ""
                            }`}
                          >
                            {step.label}
                          </p>

                          {step.current ? (
                            <p className={styles.timelineCurrentText}>
                              Etapa atual do seu pedido
                            </p>
                          ) : null}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          ) : null}

          <div className={styles.infoBox}>
            <h2 className={styles.sectionTitle}>Resumo</h2>

            <p className={styles.infoText}>
              {loading ? "Carregando resumo do pedido..." : summaryText}
            </p>

            {orderId ? (
              <div className={styles.referenceRow}>
                <span className={styles.referenceLabel}>Pedido</span>
                <code className={styles.referenceValue}>#{orderId}</code>
              </div>
            ) : null}

            {sessionId ? (
              <div className={styles.referenceRow}>
                <span className={styles.referenceLabel}>Sessão Stripe</span>
                <code className={styles.referenceValue}>{sessionId}</code>
              </div>
            ) : null}

            {order ? (
              <>
                <div className={styles.referenceRow}>
                  <span className={styles.referenceLabel}>Pagamento</span>
                  <code className={styles.referenceValue}>
                    {String(order.payment_status || "").toLowerCase() === PAYMENT_STATUS.PAID
                      ? "Pago"
                      : String(order.payment_status || "").toLowerCase() ===
                        PAYMENT_STATUS.DELIVERY_PAYMENT
                      ? "Pagamento na entrega"
                      : String(order.payment_status || "").toLowerCase() ===
                        PAYMENT_STATUS.CANCELLED
                      ? "Cancelado"
                      : "Pendente"}
                  </code>
                </div>

                <div className={styles.referenceRow}>
                  <span className={styles.referenceLabel}>Status do pedido</span>
                  <code className={styles.referenceValue}>{statusLabel}</code>
                </div>
              </>
            ) : null}

            {!loading && order ? (
              <p className={styles.tip}>
                Você pode acompanhar a evolução do pedido pela sua conta, com
                etapas como <strong>Aguardando</strong>,{" "}
                <strong>Em preparo</strong>,{" "}
                <strong>Saiu para entrega</strong> e{" "}
                <strong>Entregue</strong>.
              </p>
            ) : null}
          </div>

          <div className={styles.actions}>
            <Link to="/menu" className={styles.secondaryBtn}>
              Voltar ao cardápio
            </Link>

            <Link to="/account" className={styles.primaryBtn}>
              Acompanhar pedido
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}