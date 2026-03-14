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

function formatPrice(value) {
  if (value == null) return null;

  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(Number(value) || 0);
}

function getPaymentMethodLabel(paymentMethod) {
  const normalized = String(paymentMethod || "").trim().toLowerCase();

  if (normalized === PAYMENT_METHOD.ONLINE) return "Pagamento online";
  if (normalized === PAYMENT_METHOD.CARD_ON_DELIVERY) return "Cartão na entrega";
  if (normalized === PAYMENT_METHOD.CASH) return "Dinheiro";

  return "Não informado";
}

function getPaymentStatusLabel(paymentStatus, paymentMethod) {
  const normalizedStatus = String(paymentStatus || "").trim().toLowerCase();
  const normalizedMethod = String(paymentMethod || "").trim().toLowerCase();

  if (normalizedStatus === PAYMENT_STATUS.PAID) {
    return "Pago";
  }

  if (
    normalizedStatus === PAYMENT_STATUS.DELIVERY_PAYMENT ||
    normalizedMethod === PAYMENT_METHOD.CASH ||
    normalizedMethod === PAYMENT_METHOD.CARD_ON_DELIVERY
  ) {
    return "Pagamento na entrega";
  }

  if (normalizedStatus === PAYMENT_STATUS.CANCELLED) {
    return "Cancelado";
  }

  return "Pendente";
}

function getSuccessTitle(order) {
  if (!order) return "Carregando pedido";

  const paymentMethod = String(order.payment_method || "").trim().toLowerCase();
  const paymentStatus = String(order.payment_status || "").trim().toLowerCase();

  if (paymentMethod === PAYMENT_METHOD.ONLINE) {
    return paymentStatus === PAYMENT_STATUS.PAID
      ? "Pagamento aprovado com sucesso"
      : "Pedido recebido com pagamento pendente";
  }

  if (paymentMethod === PAYMENT_METHOD.CASH) {
    return "Pedido confirmado";
  }

  if (paymentMethod === PAYMENT_METHOD.CARD_ON_DELIVERY) {
    return "Pedido confirmado";
  }

  return "Pedido confirmado";
}

function getSuccessSubtitle(order) {
  if (!order) {
    return "Estamos validando as informações do seu pedido.";
  }

  const paymentMethod = String(order.payment_method || "").trim().toLowerCase();
  const paymentStatus = String(order.payment_status || "").trim().toLowerCase();

  if (paymentMethod === PAYMENT_METHOD.ONLINE) {
    if (paymentStatus === PAYMENT_STATUS.PAID) {
      return "Seu pagamento foi confirmado e seu pedido já foi registrado com sucesso.";
    }

    return "Seu pedido foi registrado. Assim que o pagamento for confirmado, o atendimento continuará normalmente.";
  }

  if (paymentMethod === PAYMENT_METHOD.CASH) {
    return "Seu pedido foi registrado com sucesso. O pagamento será feito em dinheiro no momento da entrega.";
  }

  if (paymentMethod === PAYMENT_METHOD.CARD_ON_DELIVERY) {
    return "Seu pedido foi registrado com sucesso. O pagamento será feito com cartão no momento da entrega.";
  }

  return "Seu pedido foi registrado com sucesso.";
}

function getNextStepText(order) {
  if (!order) return "";

  const paymentMethod = String(order.payment_method || "").trim().toLowerCase();
  const paymentStatus = String(order.payment_status || "").trim().toLowerCase();

  if (paymentMethod === PAYMENT_METHOD.ONLINE) {
    if (paymentStatus === PAYMENT_STATUS.PAID) {
      return "Agora é só aguardar. Você pode acompanhar a evolução do pedido pela sua conta.";
    }

    return "Você pode acompanhar a confirmação do pagamento e a evolução do pedido pela sua conta.";
  }

  return "Você pode acompanhar o andamento do pedido pela sua conta.";
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
    async function loadOrder() {
      if (!orderId) {
        setErrorMessage("Pedido não encontrado.");
        setLoading(false);
        return;
      }

      try {
        const { data: existingOrder, error: fetchError } = await supabase
          .from("orders")
          .select("*")
          .eq("id", orderId)
          .maybeSingle();

        if (fetchError) {
          throw fetchError;
        }

        if (!existingOrder) {
          throw new Error("Pedido não encontrado.");
        }

        const paymentMethod = String(
          existingOrder.payment_method || ""
        ).trim().toLowerCase();

        if (paymentMethod !== PAYMENT_METHOD.ONLINE) {
          setOrder(existingOrder);
          return;
        }

        const { data, error } = await supabase.rpc(
          "confirm_online_order_payment",
          {
            p_order_id: orderId,
            p_session_id: sessionId || null,
          }
        );

        if (error) {
          throw error;
        }

        const resolvedOrder = Array.isArray(data) ? data[0] : data;

        if (!resolvedOrder) {
          throw new Error("Não foi possível carregar os dados do pedido.");
        }

        setOrder(resolvedOrder);
      } catch (error) {
        console.error("Erro ao carregar confirmação do pedido:", error);
        setErrorMessage(
          error?.message || "Não foi possível carregar os dados do pedido."
        );
      } finally {
        setLoading(false);
      }
    }

    loadOrder();
  }, [orderId, sessionId]);

  const successTitle = useMemo(() => getSuccessTitle(order), [order]);
  const subtitle = useMemo(() => getSuccessSubtitle(order), [order]);
  const nextStepText = useMemo(() => getNextStepText(order), [order]);

  const isGuestTestOrder = useMemo(() => {
    return Boolean(order?.is_test_order);
  }, [order]);

  async function handleCopyOrderId() {
    if (!orderId) return;

    try {
      await navigator.clipboard.writeText(orderId);
      alert("Número do pedido copiado com sucesso.");
    } catch (error) {
      console.error("Erro ao copiar número do pedido:", error);
      alert("Não foi possível copiar o número do pedido.");
    }
  }

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
            <div className={styles.infoBox}>
              <h2 className={styles.sectionTitle}>Resumo do pedido</h2>

              {loading ? (
                <p className={styles.infoText}>Carregando resumo do pedido...</p>
              ) : (
                <div className={styles.summaryGrid}>
                  {orderId ? (
                    <div className={`${styles.referenceRow} ${styles.referenceRowFull}`}>
                      <span className={styles.referenceLabel}>Pedido</span>
                      <code className={styles.referenceValue}>#{orderId}</code>
                    </div>
                  ) : null}

                  <div className={styles.referenceRow}>
                    <span className={styles.referenceLabel}>Forma de pagamento</span>
                    <code className={styles.referenceValue}>
                      {getPaymentMethodLabel(order?.payment_method)}
                    </code>
                  </div>

                  <div className={styles.referenceRow}>
                    <span className={styles.referenceLabel}>Pagamento</span>
                    <code className={styles.referenceValue}>
                      {getPaymentStatusLabel(order?.payment_status, order?.payment_method)}
                    </code>
                  </div>

                  {order?.total != null ? (
                    <div className={styles.referenceRow}>
                      <span className={styles.referenceLabel}>Total</span>
                      <code className={styles.referenceValue}>
                        {formatPrice(order.total)}
                      </code>
                    </div>
                  ) : null}

                  {order?.customer_name ? (
                    <div className={styles.referenceRow}>
                      <span className={styles.referenceLabel}>Cliente</span>
                      <code className={styles.referenceValue}>{order.customer_name}</code>
                    </div>
                  ) : null}

                  {order?.customer_phone ? (
                    <div className={styles.referenceRow}>
                      <span className={styles.referenceLabel}>Telefone</span>
                      <code className={styles.referenceValue}>{order.customer_phone}</code>
                    </div>
                  ) : null}
                </div>
              )}
            </div>
          ) : null}

          {!errorMessage && !loading ? (
            <div className={styles.infoBox}>
              <h2 className={styles.sectionTitle}>Próximo passo</h2>

              {isGuestTestOrder ? (
                <>
                  <p className={styles.infoText}>
                    Esta compra foi feita sem cadastro. O acompanhamento pela conta não
                    está disponível nesta sessão.
                  </p>
                  <p className={styles.tip}>
                    Guarde o número do pedido para referência.
                  </p>
                </>
              ) : (
                <>
                  <p className={styles.infoText}>{nextStepText}</p>
                  <p className={styles.tip}>
                    O acompanhamento detalhado do pedido fica disponível na sua conta.
                  </p>
                </>
              )}
            </div>
          ) : null}

          <div className={styles.actions}>
            <Link to="/menu" className={styles.secondaryBtn}>
              Voltar ao cardápio
            </Link>

            {!loading && !errorMessage ? (
              isGuestTestOrder ? (
                <button
                  type="button"
                  className={styles.primaryBtn}
                  onClick={handleCopyOrderId}
                >
                  Copiar número do pedido
                </button>
              ) : (
                <Link to="/account" className={styles.primaryBtn}>
                  Acompanhar pedido
                </Link>
              )
            ) : null}
          </div>
        </section>
      </div>
    </main>
  );
}