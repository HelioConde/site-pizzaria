import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import styles from "./Motoboy.module.css";
import MotoboyDeliveryMap from "../../components/maps/DeliveryRouteMap";

import DashboardHeader from "../../components/layout/DashboardHeader/DashboardHeader";
import MotoboyOrderCard from "./components/MotoboyOrderCard";

import { ORDER_STATUS, USER_ROLE } from "./motoboy.constants";
import { isSameDay, normalizeOrderStatus } from "../Admin/admin.utils";

const DELIVERY_QUERY_STATUSES = [
  "waiting_courier",
  "awaiting_courier",
  "aguardando_motoboy",
  "delivery",
  "out_for_delivery",
  "saiu_para_entrega",
];

const NOTIFICATION_SOUND_SRC = `${import.meta.env.BASE_URL}sounds/new-order.mp3`;
const GPS_MIN_SEND_INTERVAL = 5000;

export default function Motoboy() {
  
  const navigate = useNavigate();

  const [orders, setOrders] = useState([]);
  const [availableOrders, setAvailableOrders] = useState([]);
  const [myActiveOrder, setMyActiveOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [accessLoading, setAccessLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  const [message, setMessage] = useState("");
  const [updatingOrderId, setUpdatingOrderId] = useState(null);
  const [userInfo, setUserInfo] = useState({
    id: "",
    name: "Motoboy",
    email: "",
  });
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [showEnableSoundButton, setShowEnableSoundButton] = useState(false);
  const [gpsActive, setGpsActive] = useState(false);
  const [gpsError, setGpsError] = useState("");
  const [lastGpsAt, setLastGpsAt] = useState(null);
  const [currentCourierPosition, setCurrentCourierPosition] = useState({
    latitude: null,
    longitude: null,
  });

  const audioUnlockedRef = useRef(false);
  const knownAvailableOrderIdsRef = useRef(new Set());
  const pageTitleRef = useRef(document.title);
  const titleBlinkIntervalRef = useRef(null);
  const watchIdRef = useRef(null);
  const lastSentLocationRef = useRef({
    lat: null,
    lng: null,
    sentAt: 0,
  });

  const stopTitleBlink = useCallback(() => {
    if (titleBlinkIntervalRef.current) {
      clearInterval(titleBlinkIntervalRef.current);
      titleBlinkIntervalRef.current = null;
    }

    document.title = pageTitleRef.current;
  }, []);

  const startTitleBlink = useCallback((text = "Nova entrega!") => {
    if (titleBlinkIntervalRef.current) return;

    let toggle = false;

    titleBlinkIntervalRef.current = setInterval(() => {
      document.title = toggle ? text : pageTitleRef.current;
      toggle = !toggle;
    }, 1000);
  }, []);

  const requestNotificationPermission = useCallback(async () => {
    if (!("Notification" in window)) return;

    if (Notification.permission === "default") {
      try {
        await Notification.requestPermission();
      } catch (error) {
        console.warn("Não foi possível pedir permissão de notificação:", error);
      }
    }
  }, []);

  const unlockAudio = useCallback(async () => {
    try {
      const audio = new Audio(NOTIFICATION_SOUND_SRC);
      audio.volume = 0.01;
      audio.preload = "auto";

      await audio.play();
      audio.pause();
      audio.currentTime = 0;

      audioUnlockedRef.current = true;
      setAudioEnabled(true);
      setShowEnableSoundButton(false);

      await requestNotificationPermission();
    } catch (error) {
      audioUnlockedRef.current = false;
      setAudioEnabled(false);
      setShowEnableSoundButton(true);
      console.warn("Áudio do motoboy ainda bloqueado:", error);
    }
  }, [requestNotificationPermission]);

  const playNotificationSound = useCallback(() => {
    if (!audioUnlockedRef.current) {
      setAudioEnabled(false);
      setShowEnableSoundButton(true);
      return;
    }

    try {
      const audio = new Audio(NOTIFICATION_SOUND_SRC);
      audio.volume = 0.5;
      audio.preload = "auto";

      audio.play().catch((error) => {
        console.warn("Não foi possível tocar o som do motoboy:", error);
        audioUnlockedRef.current = false;
        setAudioEnabled(false);
        setShowEnableSoundButton(true);
      });
    } catch (error) {
      console.error("Erro ao tocar som do motoboy:", error);
      audioUnlockedRef.current = false;
      setAudioEnabled(false);
      setShowEnableSoundButton(true);
    }
  }, []);

  const showBrowserNotification = useCallback((order) => {
    if (!("Notification" in window)) return;

    if (Notification.permission === "granted") {
      const notification = new Notification("Nova entrega disponível", {
        body: `${order.customer_name || "Cliente"} • ${Number(
          order.total || 0
        ).toLocaleString("pt-BR", {
          style: "currency",
          currency: "BRL",
        })}`,
        icon: `${import.meta.env.BASE_URL}favicon.ico`,
      });

      notification.onclick = () => {
        window.focus();
      };
    }
  }, []);

  const stopGpsTracking = useCallback(() => {
    if (watchIdRef.current !== null) {
      console.log("🛑 Parando watch GPS:", watchIdRef.current);
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }

    setGpsActive(false);
    setCurrentCourierPosition({
      latitude: null,
      longitude: null,
    });
  }, []);

  async function debugGeolocationPermission() {
    if (!navigator.permissions) {
      console.log("⚠️ Permissions API não suportada.");
      return;
    }

    try {
      const result = await navigator.permissions.query({ name: "geolocation" });
      console.log("🔐 Permissão de geolocalização:", result.state);

      result.onchange = () => {
        console.log("🔄 Permissão mudou para:", result.state);
      };
    } catch (error) {
      console.error("Erro ao consultar permissão:", error);
    }
  }


  navigator.geolocation.getCurrentPosition(
    (position) => {
      console.log("GPS OK", position.coords);
    },
    (error) => {
      console.error("GPS ERRO", error);
    },
    {
      enableHighAccuracy: false,
      timeout: 20000,
      maximumAge: 10000,
    }
  );
  useEffect(() => {
    debugGeolocationPermission();
  }, []);

  
const sendLocation = useCallback(
  async (orderId, latitude, longitude) => {
    console.log("📤 Tentando enviar localização ao Supabase...", {
      orderId,
      latitude,
      longitude,
    });

    try {
      const { error } = await supabase
        .from("order_delivery_tracking")
        .insert({
          order_id: orderId,
          courier_id: userInfo.id,
          latitude,
          longitude,
        });

      if (error) throw error;

      console.log("✅ Localização enviada ao Supabase com sucesso");
    } catch (error) {
      console.error("❌ Erro no Supabase ao enviar localização:", error);
    }
  },
  [userInfo.id]
);

  const startGpsTracking = useCallback(
    async (orderId) => {
      console.log("📡 Tentando iniciar GPS...", {
        orderId,
        hasGeolocation: "geolocation" in navigator,
        isSecureContext: window.isSecureContext,
      });

      if (!navigator.geolocation) {
        setGpsError("Geolocalização não é suportada neste dispositivo.");
        return;
      }

      if (!orderId) {
        setGpsError("Nenhuma entrega ativa para rastrear.");
        return;
      }

      if (watchIdRef.current !== null) {
        console.log("🛑 Limpando watch anterior:", watchIdRef.current);
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }

      setGpsError("");

      const logPosition = async (position, source = "watch") => {
        const latitude = position.coords.latitude;
        const longitude = position.coords.longitude;

        console.log(`✅ GPS obtido via ${source}`, {
          latitude,
          longitude,
          accuracy: position.coords.accuracy,
          altitude: position.coords.altitude,
          speed: position.coords.speed,
          heading: position.coords.heading,
          timestamp: position.timestamp,
        });

        setCurrentCourierPosition({
          latitude,
          longitude,
        });

        setGpsActive(true);
        await sendLocation(orderId, latitude, longitude);
      };

      const handleError = (error, source = "watch") => {
        console.error(`❌ Erro ao obter GPS via ${source}:`, error);

        switch (error.code) {
          case error.PERMISSION_DENIED:
            setGpsError("Permissão de localização negada.");
            break;
          case error.POSITION_UNAVAILABLE:
            setGpsError("Localização indisponível no momento.");
            break;
          case error.TIMEOUT:
            setGpsError("Tempo esgotado ao obter localização.");
            break;
          default:
            setGpsError("Não foi possível iniciar o GPS.");
        }

        setGpsActive(false);
      };

      try {
        console.log("⏳ Tentando posição inicial...");
        await new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(
            async (position) => {
              await logPosition(position, "getCurrentPosition");
              resolve(position);
            },
            (error) => {
              reject(error);
            },
            {
              enableHighAccuracy: true,
              timeout: 20000,
              maximumAge: 0,
            }
          );
        });
      } catch (firstError) {
        console.warn("⚠️ Falha na posição inicial com alta precisão:", firstError);

        try {
          console.log("🔁 Tentando fallback com precisão normal...");
          await new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(
              async (position) => {
                await logPosition(position, "fallback");
                resolve(position);
              },
              (error) => {
                reject(error);
              },
              {
                enableHighAccuracy: false,
                timeout: 20000,
                maximumAge: 10000,
              }
            );
          });
        } catch (fallbackError) {
          handleError(fallbackError, "fallback");
          return;
        }
      }

      console.log("📡 Iniciando watchPosition contínuo...");

      const watchId = navigator.geolocation.watchPosition(
        async (position) => {
          await logPosition(position, "watchPosition");
        },
        (error) => {
          handleError(error, "watchPosition");
        },
        {
          enableHighAccuracy: false,
          timeout: 20000,
          maximumAge: 10000,
        }
      );

      watchIdRef.current = watchId;
      console.log("✅ watchPosition iniciado com ID:", watchId);
    },
    [sendLocation]
  );
  const mapOrdersWithItems = useCallback(async (ordersData) => {
    const safeOrders = (ordersData ?? []).map((order) => ({
      ...order,
      normalized_status: normalizeOrderStatus(order),
    }));

    if (!safeOrders.length) {
      return [];
    }

    const orderIds = safeOrders.map((order) => order.id);

    const { data: itemsData, error: itemsError } = await supabase
      .from("order_items")
      .select("*")
      .in("order_id", orderIds);

    if (itemsError) throw itemsError;

    const itemsByOrderId = (itemsData ?? []).reduce((acc, item) => {
      if (!acc[item.order_id]) {
        acc[item.order_id] = [];
      }

      acc[item.order_id].push(item);
      return acc;
    }, {});

    return safeOrders.map((order) => ({
      ...order,
      order_items: itemsByOrderId[order.id] ?? [],
    }));
  }, []);

  const loadOrders = useCallback(async () => {
    setLoading(true);

    try {
      const { data: ordersData, error: ordersError } = await supabase
        .from("orders")
        .select("*")
        .in("order_status", DELIVERY_QUERY_STATUSES)
        .order("created_at", { ascending: false });

      if (ordersError) throw ordersError;

      const mergedOrders = await mapOrdersWithItems(ordersData ?? []);

      const nextAvailableOrders = mergedOrders.filter((order) => {
        const normalizedStatus = order.normalized_status;
        const assignedToCourier = Boolean(order.delivery_user_id);

        return (
          normalizedStatus === ORDER_STATUS.WAITING_COURIER &&
          !assignedToCourier
        );
      });

      const nextMyActiveOrder =
        mergedOrders.find((order) => {
          const normalizedStatus = order.normalized_status;
          const assignedToMe =
            String(order.delivery_user_id || "") === String(userInfo.id || "");

          return normalizedStatus === ORDER_STATUS.DELIVERY && assignedToMe;
        }) || null;

      setOrders(mergedOrders);
      setAvailableOrders(nextAvailableOrders);
      setMyActiveOrder(nextMyActiveOrder);
      setMessage("");

      knownAvailableOrderIdsRef.current = new Set(
        nextAvailableOrders.map((order) => order.id)
      );
    } catch (error) {
      console.error("Erro ao carregar pedidos do motoboy:", error);
      setOrders([]);
      setAvailableOrders([]);
      setMyActiveOrder(null);
      setMessage("Não foi possível carregar os pedidos para entrega.");
    } finally {
      setLoading(false);
    }
  }, [mapOrdersWithItems, userInfo.id]);

  useEffect(() => {
    async function checkAudioPermission() {
      try {
        const audio = new Audio(NOTIFICATION_SOUND_SRC);
        audio.volume = 0.01;
        audio.preload = "auto";

        await audio.play();
        audio.pause();
        audio.currentTime = 0;

        audioUnlockedRef.current = true;
        setAudioEnabled(true);
        setShowEnableSoundButton(false);
      } catch {
        audioUnlockedRef.current = false;
        setAudioEnabled(false);
        setShowEnableSoundButton(true);
      }
    }

    checkAudioPermission();

    const handleFocus = () => {
      stopTitleBlink();
    };

    window.addEventListener("focus", handleFocus);

    return () => {
      window.removeEventListener("focus", handleFocus);
      stopTitleBlink();
    };
  }, [stopTitleBlink]);

  useEffect(() => {
    window.addEventListener("click", unlockAudio, { once: true });
    window.addEventListener("keydown", unlockAudio, { once: true });

    return () => {
      window.removeEventListener("click", unlockAudio);
      window.removeEventListener("keydown", unlockAudio);
    };
  }, [unlockAudio]);

  useEffect(() => {
    let active = true;

    async function validateDeliveryAccess() {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session) {
          navigate("/auth", { replace: true, state: { from: "/motoboy" } });
          return;
        }

        const { data: profile, error } = await supabase
          .from("profiles")
          .select("role, name")
          .eq("id", session.user.id)
          .maybeSingle();

        if (error) throw error;

        const role = String(profile?.role || "").trim().toLowerCase();

        if (role !== USER_ROLE.DELIVERY) {
          navigate("/", { replace: true });
          return;
        }

        if (!active) return;

        setUserInfo({
          id: session.user.id,
          name:
            profile?.name ||
            session.user.user_metadata?.name ||
            session.user.email?.split("@")[0] ||
            "Motoboy",
          email: session.user.email || "",
        });

        setHasAccess(true);
      } catch (error) {
        console.error("Erro ao validar acesso do motoboy:", error);
        navigate("/", { replace: true });
      } finally {
        if (active) {
          setAccessLoading(false);
        }
      }
    }

    validateDeliveryAccess();

    return () => {
      active = false;
    };
  }, [navigate]);

  useEffect(() => {
    if (!hasAccess || !userInfo.id) return;
    loadOrders();
  }, [hasAccess, userInfo.id, loadOrders]);

  useEffect(() => {
    if (!hasAccess || !userInfo.id) return;

    function isAvailableForCourier(order) {
      const normalizedStatus = normalizeOrderStatus(order);
      return (
        normalizedStatus === ORDER_STATUS.WAITING_COURIER &&
        !order.delivery_user_id
      );
    }

    function notifyAvailableDelivery(order) {
      setMessage(
        `Nova entrega disponível para ${order.customer_name || "cliente"}.`
      );
      playNotificationSound();
      showBrowserNotification(order);
      startTitleBlink("🛵 Nova entrega!");
    }

    const channel = supabase
      .channel("orders-motoboy")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "orders",
        },
        async (payload) => {
          const newOrder = payload.new;
          const alreadyKnown = knownAvailableOrderIdsRef.current.has(newOrder.id);

          await loadOrders();

          if (alreadyKnown) return;

          if (isAvailableForCourier(newOrder)) {
            notifyAvailableDelivery(newOrder);
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "orders",
        },
        async (payload) => {
          const oldOrder = payload.old;
          const newOrder = payload.new;

          const wasAvailable = isAvailableForCourier(oldOrder);
          const isAvailable = isAvailableForCourier(newOrder);

          await loadOrders();

          if (!wasAvailable && isAvailable) {
            notifyAvailableDelivery(newOrder);
          }
        }
      )
      .subscribe((status) => {
        console.log("MOTOBOY realtime subscribe status:", status);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [
    hasAccess,
    userInfo.id,
    loadOrders,
    playNotificationSound,
    showBrowserNotification,
    startTitleBlink,
  ]);

  useEffect(() => {
    if (myActiveOrder?.id) {
      startGpsTracking(myActiveOrder.id);
    } else {
      stopGpsTracking();
    }
  }, [myActiveOrder?.id, startGpsTracking, stopGpsTracking]);

  useEffect(() => {
    return () => {
      stopGpsTracking();
    };
  }, [stopGpsTracking]);

  async function handleLogout() {
    stopGpsTracking();
    await supabase.auth.signOut();
    navigate("/", { replace: true });
  }

  async function handleAcceptDelivery(orderId) {
    console.log("HANDLE ACCEPT DELIVERY INICIO", {
      orderId,
      myActiveOrder,
      userInfo,
    });

    if (myActiveOrder) {
      setMessage("Você já possui uma entrega em andamento.");
      return;
    }

    setUpdatingOrderId(orderId);
    setMessage("");

    try {
      console.log("ANTES DO UPDATE");

      const { data, error } = await supabase
        .from("orders")
        .update({
          order_status: ORDER_STATUS.DELIVERY,
          delivery_user_id: userInfo.id,
          delivery_started_at: new Date().toISOString(),
        })
        .eq("id", orderId)
        .is("delivery_user_id", null)
        .select("*");

      console.log("RESULTADO UPDATE", { data, error });

      if (error) throw error;

      if (!data || !data.length) {
        setMessage("Essa entrega já foi aceita por outro motoboy.");
        await loadOrders();
        return;
      }

      setMessage("Entrega aceita com sucesso. GPS iniciado.");
      await loadOrders();
    } catch (error) {
      console.error("Erro ao aceitar entrega:", error);
      setMessage(error?.message || "Não foi possível aceitar a entrega.");
    } finally {
      setUpdatingOrderId(null);
    }
  }

  async function handleMarkDelivered(orderId) {
    setUpdatingOrderId(orderId);
    setMessage("");

    try {
      stopGpsTracking();

      const { error } = await supabase
        .from("orders")
        .update({
          order_status: ORDER_STATUS.DELIVERED,
          delivered_at: new Date().toISOString(),
        })
        .eq("id", orderId)
        .eq("delivery_user_id", userInfo.id);

      if (error) throw error;

      setMessage("Pedido marcado como entregue com sucesso.");
      await loadOrders();
    } catch (error) {
      console.error("Erro ao marcar pedido como entregue:", error);
      setMessage("Não foi possível atualizar o pedido.");
    } finally {
      setUpdatingOrderId(null);
    }
  }

  const stats = useMemo(() => {
    const today = new Date();

    const deliveredToday = orders.filter((order) => {
      if (!order.delivered_at) return false;

      const deliveredAt = new Date(order.delivered_at);
      if (Number.isNaN(deliveredAt.getTime())) return false;

      return isSameDay(deliveredAt, today);
    }).length;

    return {
      availableRoutes: availableOrders.length,
      activeRoute: myActiveOrder ? 1 : 0,
      deliveredToday,
    };
  }, [orders, availableOrders, myActiveOrder]);

  if (accessLoading) {
    return (
      <main className={styles.page}>
        <section className={styles.content}>
          <div className={styles.container}>
            <div className={styles.emptyState}>
              <p>Validando acesso do motoboy...</p>
            </div>
          </div>
        </section>
      </main>
    );
  }

  if (!hasAccess) {
    return null;
  }

  return (
    <main className={styles.page}>
      <DashboardHeader
        badge="Painel do motoboy"
        userName={userInfo.name}
        userEmail={userInfo.email}
        accountLabel="Minha área"
        accountRoute="/motoboy"
        onLogout={handleLogout}
      />

      {showEnableSoundButton ? (
        <div className={styles.soundAlert}>
          <div className={styles.soundAlertContent}>
            <span className={styles.soundAlertText}>
              O som das notificações está desativado.
            </span>

            <button
              type="button"
              className={styles.soundAlertButton}
              onClick={unlockAudio}
            >
              Ativar som
            </button>
          </div>
        </div>
      ) : null}

      <section className={styles.hero}>
        <div className={styles.container}>
          <span className={styles.kicker}>Painel do motoboy</span>
          <h1 className={styles.title}>Gestão de entregas</h1>
          <p className={styles.subtitle}>
            Aceite pedidos disponíveis, acompanhe sua entrega atual e marque quando concluir.
          </p>

          {audioEnabled ? (
            <p className={styles.audioStatus}>🔊 Som ativo</p>
          ) : null}

          <div className={styles.heroTopGrid}>
            {myActiveOrder ? (
              <div className={styles.gpsStatusBox}>
                <div className={styles.gpsStatusTop}>
                  <span
                    className={`${styles.gpsBadge} ${gpsActive ? styles.gpsBadgeActive : styles.gpsBadgeInactive
                      }`}
                  >
                    {gpsActive ? "📍 GPS ativo" : "⚠️ GPS inativo"}
                  </span>

                  {lastGpsAt ? (
                    <span className={styles.gpsMeta}>
                      Última atualização:{" "}
                      {new Date(lastGpsAt).toLocaleTimeString("pt-BR")}
                    </span>
                  ) : null}
                </div>

                {gpsError ? (
                  <span className={styles.gpsError}>{gpsError}</span>
                ) : null}

                <div className={styles.gpsActions}>
                  {!gpsActive ? (
                    <button
                      type="button"
                      className={styles.primaryAction}
                      onClick={() => startGpsTracking(myActiveOrder.id)}
                    >
                      Iniciar GPS
                    </button>
                  ) : (
                    <button
                      type="button"
                      className={styles.secondaryAction}
                      onClick={stopGpsTracking}
                    >
                      Parar GPS
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className={styles.statCard}>
                <span className={styles.statLabel}>GPS</span>
                <strong className={styles.statValue}>—</strong>
              </div>
            )}

            <div className={styles.statCard}>
              <span className={styles.statLabel}>Em rota</span>
              <strong className={styles.statValue}>{stats.activeRoute}</strong>
            </div>

            <div className={styles.statCard}>
              <span className={styles.statLabel}>Entregues hoje</span>
              <strong className={styles.statValue}>{stats.deliveredToday}</strong>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.content}>
        <div className={styles.container}>
          {message ? (
            <p className={styles.pageMessage} role="status">
              {message}
            </p>
          ) : null}



          {myActiveOrder ? (
            <div className={styles.mapSection}>
              <h2 className={styles.sectionTitle}>Mapa da entrega</h2>

              <MotoboyDeliveryMap
                courierLatitude={currentCourierPosition.latitude}
                courierLongitude={currentCourierPosition.longitude}
                customerLatitude={myActiveOrder.delivery_lat}
                customerLongitude={myActiveOrder.delivery_lng}
              />
            </div>
          ) : null}



          {myActiveOrder ? (
            <section className={styles.ordersSection}>
              <div className={styles.sectionHeader}>
                <h2 className={styles.sectionTitle}>Minha entrega atual</h2>
              </div>

              <div className={styles.ordersList}>
                <MotoboyOrderCard
                  order={myActiveOrder}
                  updatingOrderId={updatingOrderId}
                  onMarkDelivered={handleMarkDelivered}
                  mode="active"
                />
              </div>
            </section>
          ) : null}

          <section className={styles.ordersSection}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>Pedidos disponíveis</h2>
            </div>
            {myActiveOrder ? (
              <div className={styles.warningBox}>
                <strong>Você já está em uma entrega.</strong>
                <span>
                  Para aceitar outro pedido, finalize primeiro a entrega atual.
                </span>
              </div>
            ) : null}

            {loading ? (
              <div className={styles.emptyState}>
                <p>Carregando entregas...</p>
              </div>
            ) : !availableOrders.length ? (
              <div className={styles.emptyState}>
                <p>Nenhum pedido aguardando motoboy no momento.</p>
              </div>
            ) : (
              <div className={styles.ordersList}>
                {availableOrders.map((order) => (
                  <MotoboyOrderCard
                    key={order.id}
                    order={order}
                    updatingOrderId={updatingOrderId}
                    onAcceptDelivery={handleAcceptDelivery}
                    mode="available"
                    hasActiveDelivery={Boolean(myActiveOrder)}
                  />
                ))}
              </div>
            )}

          </section>

        </div>
      </section>
    </main>
  );
}