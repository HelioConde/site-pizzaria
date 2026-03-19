import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import styles from "./PaymentOnlineCheck.module.css";

const CART_STORAGE_KEY = "base-studio-pizzas-cart";

function clearCartOnly() {
  localStorage.removeItem(CART_STORAGE_KEY);
}

export default function PaymentOnlineCheck() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const sessionId = searchParams.get("session_id");
  const checkoutToken = searchParams.get("checkout_token");

  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState("loading");

  const isMountedRef = useRef(true);
  const hasStartedRef = useRef(false);

  async function loadOrderByStripeSession(currentSessionId) {
    if (!currentSessionId) return null;

    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .eq("stripe_session_id", currentSessionId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Erro ao buscar pedido por stripe_session_id:", error);
      return null;
    }

    if (!Array.isArray(data) || data.length === 0) {
      return null;
    }

    return data[0];
  }

  useEffect(() => {
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (hasStartedRef.current) return;
    hasStartedRef.current = true;

    async function handleOnlineCheck() {
      try {
        setLoading(true);
        setStatus("loading");
        setMessage("");

        if (!sessionId || !checkoutToken) {
          setStatus("error");
          setMessage("Informações do pagamento online não foram encontradas.");
          return;
        }

        const existingOrder = await loadOrderByStripeSession(sessionId);

        if (existingOrder?.id) {
          clearCartOnly();

          if (!isMountedRef.current) return;

          navigate(`/payment-success?order_id=${existingOrder.id}`, {
            replace: true,
          });
          return;
        }

        const storageKey = `base-studio-pizzas-checkout-${checkoutToken}`;
        const savedCheckout = localStorage.getItem(storageKey);

        if (!savedCheckout) {
          setStatus("error");
          setMessage(
            "Não encontramos os dados temporários do checkout neste navegador."
          );
          return;
        }

        let checkoutPayload = null;

        try {
          checkoutPayload = JSON.parse(savedCheckout);
        } catch (error) {
          console.error("Erro ao ler checkout salvo:", error);
          setStatus("error");
          setMessage("Os dados temporários do checkout estão inválidos.");
          return;
        }

        if (!isMountedRef.current) return;

        setStatus("checking");
        setMessage("Confirmando seu pagamento online...");

        const { data, error } = await supabase.functions.invoke(
          "confirm-checkout-session",
          {
            body: {
              sessionId,
              checkoutToken,
              checkoutPayload,
            },
          }
        );

        if (error) {
          console.error("Erro ao confirmar sessão online:", error);
          setStatus("error");
          setMessage(
            "Não foi possível confirmar automaticamente o pagamento agora."
          );
          return;
        }

        if (data?.paid && data?.order?.id) {
          clearCartOnly();
          localStorage.removeItem(storageKey);

          if (!isMountedRef.current) return;

          navigate(`/payment-success?order_id=${data.order.id}`, {
            replace: true,
          });
          return;
        }

        if (data?.success === false) {
          setStatus("pending");
          setMessage(
            data?.message || "O pagamento ainda não foi concluído no Stripe."
          );
          return;
        }

        setStatus("error");
        setMessage("Não foi possível finalizar o processamento do pedido.");
      } catch (error) {
        console.error("Erro no PaymentOnlineCheck:", error);
        setStatus("error");
        setMessage("Ocorreu um erro ao validar seu pagamento online.");
      } finally {
        if (isMountedRef.current) {
          setLoading(false);
        }
      }
    }

    handleOnlineCheck();
  }, [sessionId, checkoutToken, navigate]);

  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <section className={styles.card}>
          <span className={styles.kicker}>Pagamento online</span>

          <div className={styles.header}>
            <div className={styles.icon}>
              {status === "error" ? "!" : status === "pending" ? "⏳" : "✓"}
            </div>

            <div>
              <h1 className={styles.title}>
                {loading
                  ? "Validando pagamento"
                  : status === "error"
                    ? "Falha na validação"
                    : status === "pending"
                      ? "Pagamento pendente"
                      : "Pagamento processado"}
              </h1>

              <p className={styles.subtitle}>
                {loading
                  ? "Estamos verificando os dados do seu pagamento."
                  : message || "Processando retorno do pagamento online."}
              </p>
            </div>
          </div>

          {status === "pending" ? (
            <div className={styles.box}>
              <p className={styles.text}>
                Seu pagamento ainda não apareceu como concluído. Aguarde alguns
                instantes e tente novamente.
              </p>
            </div>
          ) : null}

          {status === "error" ? (
            <div className={styles.box}>
              <p className={styles.text}>
                Não foi possível concluir automaticamente esta etapa.
              </p>
            </div>
          ) : null}

          <div className={styles.actions}>
            <Link to="/checkout" className={styles.secondary}>
              Voltar ao checkout
            </Link>

            <Link to="/menu" className={styles.primary}>
              Ir ao cardápio
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}