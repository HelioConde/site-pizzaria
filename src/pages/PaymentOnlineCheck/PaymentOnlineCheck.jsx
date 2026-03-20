import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import styles from "./PaymentOnlineCheck.module.css";

const CART_STORAGE_KEY = "base-studio-pizzas-cart";
const CHECKOUT_STORAGE_PREFIX = "base-studio-pizzas-checkout-";

function clearCartOnly() {
  localStorage.removeItem(CART_STORAGE_KEY);
}

function getCheckoutStorageKey(checkoutToken) {
  return `${CHECKOUT_STORAGE_PREFIX}${checkoutToken}`;
}

function normalizeBasePath(baseUrl) {
  const value = String(baseUrl || "/").trim();
  if (!value) return "/";
  return value.endsWith("/") ? value : `${value}/`;
}

function buildAppPath(path) {
  const basePath = normalizeBasePath(import.meta.env.BASE_URL);
  const cleanPath = String(path || "").replace(/^\/+/, "");
  return `${basePath}${cleanPath}`;
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
  const hasNavigatedRef = useRef(false);

  const checkoutPath = useMemo(() => buildAppPath("checkout"), []);
  const menuPath = useMemo(() => buildAppPath("menu"), []);
  const paymentSuccessPath = useMemo(() => buildAppPath("payment-success"), []);

  async function loadOrderByStripeSession(currentSessionId) {
    if (!currentSessionId) return null;

    const { data, error } = await supabase
      .from("orders")
      .select("id, stripe_session_id, created_at")
      .eq("stripe_session_id", currentSessionId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error("Erro ao buscar pedido por stripe_session_id:", error);
      return null;
    }

    return data ?? null;
  }

  function safeSetState(callback) {
    if (!isMountedRef.current || hasNavigatedRef.current) return;
    callback();
  }

  function redirectToSuccess(orderId) {
    if (!orderId || hasNavigatedRef.current) return;

    hasNavigatedRef.current = true;
    navigate(`${paymentSuccessPath}?order_id=${orderId}`, {
      replace: true,
    });
  }

  useEffect(() => {
    isMountedRef.current = true;
    hasNavigatedRef.current = false;

    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (hasStartedRef.current) return;
    hasStartedRef.current = true;

    async function handleOnlineCheck() {
      const storageKey = checkoutToken
        ? getCheckoutStorageKey(checkoutToken)
        : null;

      try {
        safeSetState(() => {
          setLoading(true);
          setStatus("loading");
          setMessage("");
        });

        if (!sessionId || !checkoutToken) {
          safeSetState(() => {
            setStatus("error");
            setMessage("Informações do pagamento online não foram encontradas.");
          });
          return;
        }

        const existingOrder = await loadOrderByStripeSession(sessionId);

        if (existingOrder?.id) {
          clearCartOnly();

          if (storageKey) {
            localStorage.removeItem(storageKey);
          }

          redirectToSuccess(existingOrder.id);
          return;
        }

        const savedCheckout = storageKey
          ? localStorage.getItem(storageKey)
          : null;

        if (!savedCheckout) {
          safeSetState(() => {
            setStatus("error");
            setMessage(
              "Não encontramos os dados temporários do checkout neste navegador."
            );
          });
          return;
        }

        let checkoutPayload = null;

        try {
          checkoutPayload = JSON.parse(savedCheckout);
        } catch (error) {
          console.error("Erro ao ler checkout salvo:", error);

          safeSetState(() => {
            setStatus("error");
            setMessage("Os dados temporários do checkout estão inválidos.");
          });
          return;
        }

        safeSetState(() => {
          setStatus("checking");
          setMessage("Confirmando seu pagamento online...");
        });

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

          safeSetState(() => {
            setStatus("error");
            setMessage(
              "Não foi possível confirmar automaticamente o pagamento agora."
            );
          });
          return;
        }

        if (data?.paid && data?.order?.id) {
          clearCartOnly();

          if (storageKey) {
            localStorage.removeItem(storageKey);
          }

          redirectToSuccess(data.order.id);
          return;
        }

        const confirmedOrder = await loadOrderByStripeSession(sessionId);

        if (confirmedOrder?.id) {
          clearCartOnly();

          if (storageKey) {
            localStorage.removeItem(storageKey);
          }

          redirectToSuccess(confirmedOrder.id);
          return;
        }

        if (data?.success === false) {
          safeSetState(() => {
            setStatus("pending");
            setMessage(
              data?.message || "O pagamento ainda não foi concluído no Stripe."
            );
          });
          return;
        }

        safeSetState(() => {
          setStatus("error");
          setMessage("Não foi possível finalizar o processamento do pedido.");
        });
      } catch (error) {
        console.error("Erro no PaymentOnlineCheck:", error);

        safeSetState(() => {
          setStatus("error");
          setMessage("Ocorreu um erro ao validar seu pagamento online.");
        });
      } finally {
        safeSetState(() => {
          setLoading(false);
        });
      }
    }

    handleOnlineCheck();
  }, [sessionId, checkoutToken, navigate, paymentSuccessPath]);

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
            <Link to={checkoutPath} className={styles.secondary}>
              Voltar ao checkout
            </Link>

            <Link to={menuPath} className={styles.primary}>
              Ir ao cardápio
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}