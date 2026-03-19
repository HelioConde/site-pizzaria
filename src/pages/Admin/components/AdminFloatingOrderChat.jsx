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

export default function AdminFloatingOrderChat({
  orderId,
  customerName,
  unreadCount = 0,
  minimized = false,
  onClose,
  onToggleMinimize,
  onGoToOrder,
  onMarkAsRead,
}) {
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [chatError, setChatError] = useState("");
  const [currentUser, setCurrentUser] = useState(null);

  const listRef = useRef(null);

  const canSend = useMemo(() => {
    return Boolean(String(message || "").trim()) && !sending && !!currentUser?.id;
  }, [message, sending, currentUser]);

  const scrollToBottom = useCallback(() => {
    requestAnimationFrame(() => {
      if (!listRef.current) return;
      listRef.current.scrollTop = listRef.current.scrollHeight;
    });
  }, []);

  useEffect(() => {
    let active = true;

    async function loadCurrentUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!active) return;
      setCurrentUser(user || null);
    }

    loadCurrentUser();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;

    async function loadMessages() {
      setLoading(true);
      setChatError("");

      const { data, error } = await supabase
        .from("order_messages")
        .select("*")
        .eq("order_id", orderId)
        .order("created_at", { ascending: true });

      if (!active) return;

      if (error) {
        console.error("Erro ao carregar mensagens do chat flutuante:", error);
        setMessages([]);
        setChatError("Não foi possível carregar o chat.");
        setLoading(false);
        return;
      }

      setMessages(data || []);
      setLoading(false);

      if (!minimized) {
        scrollToBottom();
      }
    }

    loadMessages();

    const channel = supabase
      .channel(`admin-floating-order-messages-${orderId}`)
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
            const alreadyExists = prev.some((item) => item.id === payload.new.id);
            if (alreadyExists) return prev;
            return [...prev, payload.new];
          });

          if (!minimized) {
            scrollToBottom();
          }
        }
      )
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, [orderId, minimized, scrollToBottom]);

  useEffect(() => {
    if (!minimized) {
      onMarkAsRead?.(orderId);
      scrollToBottom();
    }
  }, [minimized, onMarkAsRead, orderId, scrollToBottom]);

  async function handleSendMessage(event) {
    event.preventDefault();

    const trimmed = String(message || "").trim();

    if (!trimmed || !currentUser?.id || sending) return;

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
        return [...prev, data];
      });

      setMessage("");
      onMarkAsRead?.(orderId);
      scrollToBottom();
    } catch (error) {
      console.error("Erro ao enviar mensagem no chat flutuante:", error);
      setChatError("Não foi possível enviar a mensagem.");
    } finally {
      setSending(false);
    }
  }

  return (
    <section
      className={`${styles.adminFloatingChat} ${
        unreadCount > 0 ? styles.adminFloatingChatUnread : ""
      } ${minimized ? styles.adminFloatingChatMinimized : ""}`}
      onMouseDown={() => onMarkAsRead?.(orderId)}
    >
      <div
        className={`${styles.adminFloatingChatHeader} ${
          unreadCount > 0 ? styles.adminFloatingChatHeaderUnread : ""
        }`}
      >
        <button
          type="button"
          className={styles.adminFloatingChatTitleButton}
          onClick={() => onGoToOrder?.(orderId)}
          title="Ir para o pedido"
        >
          <div className={styles.adminFloatingChatTitleWrap}>
            <strong>Pedido #{String(orderId).slice(0, 8)}</strong>
            <span>{customerName || "Cliente"}</span>
          </div>
        </button>

        <div className={styles.adminFloatingChatHeaderActions}>
          {unreadCount > 0 ? (
            <span className={styles.adminFloatingChatUnreadBadge}>
              {unreadCount}
            </span>
          ) : null}

          <button
            type="button"
            className={styles.adminFloatingChatIconButton}
            onClick={() => onToggleMinimize?.(orderId)}
            title={minimized ? "Expandir chat" : "Minimizar chat"}
          >
            {minimized ? "▢" : "—"}
          </button>

          <button
            type="button"
            className={styles.adminFloatingChatIconButton}
            onClick={() => onClose?.(orderId)}
            title="Fechar chat"
          >
            ✕
          </button>
        </div>
      </div>

      {!minimized ? (
        <>
          <div ref={listRef} className={styles.adminFloatingChatMessages}>
            {loading ? (
              <div className={styles.chatEmptyState}>
                <p>Carregando conversa...</p>
              </div>
            ) : chatError ? (
              <div className={styles.chatEmptyState}>
                <p>{chatError}</p>
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
                    className={`${styles.adminFloatingChatBubble} ${
                      isAdmin
                        ? styles.adminFloatingChatBubbleAdmin
                        : styles.adminFloatingChatBubbleCustomer
                    }`}
                  >
                    <div className={styles.adminFloatingChatBubbleMeta}>
                      <strong>{item.sender_name || "Usuário"}</strong>
                      <span>{formatChatTime(item.created_at)}</span>
                    </div>

                    <p className={styles.adminFloatingChatBubbleText}>
                      {item.message}
                    </p>
                  </article>
                );
              })
            )}
          </div>

          <form className={styles.adminFloatingChatForm} onSubmit={handleSendMessage}>
            <textarea
              className={styles.chatInput}
              placeholder="Digite uma mensagem para o cliente..."
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              onFocus={() => onMarkAsRead?.(orderId)}
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
                {sending ? "Enviando..." : "Enviar"}
              </button>
            </div>
          </form>
        </>
      ) : null}
    </section>
  );
}