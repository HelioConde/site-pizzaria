import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "../../../lib/supabase";
import styles from "../Account.module.css";
import { playChatSound } from "../../../utils/chatSound";

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

export default function AccountOrderChat({
  orderId,
  orderLabel,
  onClose,
  onIncomingMessage,
  onMarkAsRead,
}) {
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [chatError, setChatError] = useState("");
  const [currentUser, setCurrentUser] = useState(null);

  const listRef = useRef(null);
  const currentUserRef = useRef(null);
  const hasMarkedInitialReadRef = useRef(false);

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
    currentUserRef.current = currentUser;
  }, [currentUser]);

  useEffect(() => {
    hasMarkedInitialReadRef.current = false;
  }, [orderId]);

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
        console.error("Erro ao carregar usuário do chat:", error);
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
      setLoading(true);
      setChatError("");

      try {
        const { data, error } = await supabase
          .from("order_messages")
          .select("*")
          .eq("order_id", orderId)
          .order("created_at", { ascending: true });

        if (!active) return;

        if (error) {
          console.error("Erro ao carregar mensagens do cliente:", error);
          setMessages([]);
          setChatError("Não foi possível carregar o chat.");
          setLoading(false);
          return;
        }

        setMessages(data || []);
        setLoading(false);
        scrollToBottom();

        if (!hasMarkedInitialReadRef.current) {
          hasMarkedInitialReadRef.current = true;
          onMarkAsRead?.();
        }
      } catch (error) {
        console.error("Erro inesperado ao carregar mensagens do cliente:", error);
        if (!active) return;
        setMessages([]);
        setChatError("Não foi possível carregar o chat.");
        setLoading(false);
      }
    }

    loadMessages();

    const channel = supabase
      .channel(`account-floating-order-messages-${orderId}`)
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

          const newMessage = payload.new;
          const currentUserId = currentUserRef.current?.id || null;
          const isOwnMessage = newMessage.sender_user_id === currentUserId;
          const isIncomingFromStore =
            !isOwnMessage && newMessage.sender_role !== "customer";

          setMessages((prev) => {
            const alreadyExists = prev.some((item) => item.id === newMessage.id);
            if (alreadyExists) return prev;
            return [...prev, newMessage];
          });

          if (isIncomingFromStore) {
            console.log("[ACCOUNT CHAT] mensagem recebida da loja, tocando som");
            playChatSound();
            onIncomingMessage?.(newMessage);
            onMarkAsRead?.();
          }

          scrollToBottom();
        }
      )
      .subscribe((status) => {
        console.log(`CHAT CLIENTE ${orderId} realtime status:`, status);
      });

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, [orderId, scrollToBottom, onIncomingMessage, onMarkAsRead]);

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
        "Cliente";

      const payload = {
        order_id: orderId,
        sender_user_id: currentUser.id,
        sender_name: senderName,
        sender_role: "customer",
        message: trimmed,
      };

      const { data, error } = await supabase
        .from("order_messages")
        .insert(payload)
        .select()
        .single();

      if (error) throw error;

      setMessages((prev) => {
        const alreadyExists = prev.some((item) => item.id === data.id);
        if (alreadyExists) return prev;
        return [...prev, data];
      });

      setMessage("");
      scrollToBottom();
    } catch (error) {
      console.error("Erro ao enviar mensagem do cliente:", error);
      setChatError("Não foi possível enviar a mensagem.");
    } finally {
      setSending(false);
    }
  }

  return (
    <section className={styles.floatingChatCard}>
      <div className={styles.floatingChatHeader}>
        <div className={styles.floatingChatHeaderText}>
          <strong>Chat do pedido</strong>
          <span>{orderLabel || `Pedido #${String(orderId).slice(0, 8)}`}</span>
        </div>

        <button
          type="button"
          className={styles.floatingChatCloseButton}
          onClick={onClose}
          aria-label="Fechar chat"
          title="Fechar chat"
        >
          ✕
        </button>
      </div>

      <div ref={listRef} className={styles.floatingChatMessages}>
        {loading ? (
          <div className={styles.orderChatEmptyState}>
            <p>Carregando conversa...</p>
          </div>
        ) : chatError ? (
          <div className={styles.orderChatEmptyState}>
            <p>{chatError}</p>
          </div>
        ) : !messages.length ? (
          <div className={styles.orderChatEmptyState}>
            <p>Nenhuma mensagem ainda.</p>
            <span>Envie a primeira mensagem para a loja.</span>
          </div>
        ) : (
          messages.map((item) => {
            const isCustomer = item.sender_role === "customer";

            return (
              <article
                key={item.id}
                className={`${styles.orderChatBubble} ${
                  isCustomer
                    ? styles.orderChatBubbleCustomer
                    : styles.orderChatBubbleStore
                }`}
              >
                <div className={styles.orderChatBubbleMeta}>
                  <strong>{item.sender_name || "Usuário"}</strong>
                  <span>{formatChatTime(item.created_at)}</span>
                </div>

                <p className={styles.orderChatBubbleText}>{item.message}</p>
              </article>
            );
          })
        )}
      </div>

      <form className={styles.floatingChatForm} onSubmit={handleSendMessage}>
        <textarea
          className={styles.orderChatInput}
          placeholder="Digite uma mensagem sobre este pedido..."
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          onFocus={onMarkAsRead}
          rows={3}
        />

        <div className={styles.orderChatActions}>
          <div className={styles.orderChatFeedback}>
            {chatError ? (
              <span className={styles.orderChatError}>{chatError}</span>
            ) : null}
          </div>

          <button
            type="submit"
            className={styles.orderChatSendButton}
            disabled={!canSend}
          >
            {sending ? "Enviando..." : "Enviar mensagem"}
          </button>
        </div>
      </form>
    </section>
  );
}