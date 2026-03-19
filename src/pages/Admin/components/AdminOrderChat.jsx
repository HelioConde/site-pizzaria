import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "../../../lib/supabase";
import styles from "../Admin.module.css";

function formatChatTime(value) {
  if (!value) return "";

  try {
    return new Intl.DateTimeFormat("pt-BR", {
      dateStyle: "short",
      timeStyle: "short",
    }).format(new Date(value));
  } catch {
    return "";
  }
}

export default function AdminOrderChat({ orderId }) {
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [chatError, setChatError] = useState("");
  const [currentUser, setCurrentUser] = useState(null);

  const listRef = useRef(null);

  const canSend = useMemo(() => {
    return (
      Boolean(String(message || "").trim()) &&
      !sending &&
      !!currentUser?.id &&
      !!orderId
    );
  }, [message, sending, currentUser, orderId]);

  const scrollToBottom = useCallback((behavior = "auto") => {
    requestAnimationFrame(() => {
      if (!listRef.current) return;

      listRef.current.scrollTo({
        top: listRef.current.scrollHeight,
        behavior,
      });
    });
  }, []);

  useEffect(() => {
    let active = true;

    async function loadCurrentUser() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!active) return;
        setCurrentUser(user || null);
      } catch (error) {
        console.error("Erro ao carregar usuário atual do chat admin:", error);
        if (!active) return;
        setCurrentUser(null);
      }
    }

    loadCurrentUser();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;

    async function loadMessages() {
      if (!orderId) {
        setMessages([]);
        setLoading(false);
        setChatError("Pedido inválido para carregar o chat.");
        return;
      }

      setLoading(true);
      setChatError("");
      setMessages([]);

      const { data, error } = await supabase
        .from("order_messages")
        .select("*")
        .eq("order_id", orderId)
        .order("created_at", { ascending: true });

      if (!active) return;

      if (error) {
        console.error("Erro ao carregar mensagens:", error);
        setMessages([]);
        setChatError("Não foi possível carregar o chat.");
        setLoading(false);
        return;
      }

      setMessages(Array.isArray(data) ? data : []);
      setLoading(false);
      scrollToBottom("auto");
    }

    loadMessages();

    const channel = orderId
      ? supabase
          .channel(`order-messages-${orderId}`)
          .on(
            "postgres_changes",
            {
              event: "INSERT",
              schema: "public",
              table: "order_messages",
              filter: `order_id=eq.${orderId}`,
            },
            (payload) => {
              if (!active) return;

              setMessages((prev) => {
                const alreadyExists = prev.some(
                  (item) => item.id === payload.new.id
                );
                if (alreadyExists) return prev;

                const next = [...prev, payload.new];
                next.sort(
                  (a, b) =>
                    new Date(a.created_at).getTime() -
                    new Date(b.created_at).getTime()
                );
                return next;
              });

              scrollToBottom("smooth");
            }
          )
          .subscribe((status) => {
            console.log(`CHAT ADMIN ${orderId} realtime status:`, status);
          })
      : null;

    return () => {
      active = false;

      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [orderId, scrollToBottom]);

  async function handleSendMessage(event) {
    event.preventDefault();

    const trimmed = String(message || "").trim();

    if (!trimmed || !currentUser?.id || sending || !orderId) return;

    setSending(true);
    setChatError("");

    try {
      const senderName =
        currentUser.user_metadata?.name ||
        currentUser.email?.split("@")[0] ||
        "Administrador";

      const { data, error } = await supabase
        .from("order_messages")
        .insert({
          order_id: orderId,
          sender_user_id: currentUser.id,
          sender_name: senderName,
          sender_role: "admin",
          message: trimmed,
        })
        .select()
        .single();

      if (error) throw error;

      setMessages((prev) => {
        const alreadyExists = prev.some((item) => item.id === data.id);
        if (alreadyExists) return prev;

        const next = [...prev, data];
        next.sort(
          (a, b) =>
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );
        return next;
      });

      setMessage("");
      scrollToBottom("smooth");
    } catch (error) {
      console.error("Erro ao enviar mensagem:", error);
      setChatError("Não foi possível enviar a mensagem.");
    } finally {
      setSending(false);
    }
  }

  return (
    <section className={styles.chatCard}>
      <div className={styles.chatHeader}>
        <div className={styles.chatHeaderText}>
          <span className={styles.infoLabel}>Chat com cliente</span>
          <p className={styles.chatSubtitle}>
            Use este espaço para alinhar endereço, referência ou status do
            pedido.
          </p>
        </div>
      </div>

      <div ref={listRef} className={styles.chatMessages}>
        {loading ? (
          <div className={styles.chatEmptyState}>
            <p>Carregando conversa...</p>
          </div>
        ) : !messages.length ? (
          <div className={styles.chatEmptyState}>
            <p>Nenhuma mensagem ainda.</p>
          </div>
        ) : (
          messages.map((item) => {
            const isAdmin = item.sender_role === "admin";

            return (
              <article
                key={item.id}
                className={`${styles.chatBubble} ${
                  isAdmin ? styles.chatBubbleAdmin : styles.chatBubbleOther
                }`}
              >
                <div className={styles.chatBubbleMeta}>
                  <strong>{item.sender_name || "Usuário"}</strong>
                  <span>{formatChatTime(item.created_at)}</span>
                </div>

                <p className={styles.chatBubbleText}>{item.message}</p>
              </article>
            );
          })
        )}
      </div>

      <form className={styles.chatForm} onSubmit={handleSendMessage}>
        <textarea
          className={styles.chatInput}
          placeholder="Digite uma mensagem para o cliente..."
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          rows={3}
        />

        <div className={styles.chatActions}>
          <div className={styles.chatFeedback}>
            {chatError ? (
              <span className={styles.chatError}>{chatError}</span>
            ) : null}
          </div>

          <button
            type="submit"
            className={styles.chatSendButton}
            disabled={!canSend}
          >
            {sending ? "Enviando..." : "Enviar mensagem"}
          </button>
        </div>
      </form>
    </section>
  );
}