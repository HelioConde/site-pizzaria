import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "../../../lib/supabase";
import AdminContentHeader from "../components/AdminContentHeader";
import ConfirmDialog from "../../../components/ui/ConfirmDialog/ConfirmDialog";
import MotoboyDeliveryMap from "../../../components/maps/DeliveryRouteMap";
import styles from "../Admin.module.css";

const initialCreateForm = {
  name: "",
  email: "",
  password: "",
};

function normalizeEmail(value) {
  return String(value || "").trim().toLowerCase();
}

function buildOrdersStatsByCourier(orders) {
  return (orders ?? []).reduce((acc, order) => {
    const courierId = String(order.delivery_user_id || "").trim();
    if (!courierId) return acc;

    if (!acc[courierId]) {
      acc[courierId] = {
        total: 0,
        active: 0,
        delivered: 0,
      };
    }

    const normalizedStatus = String(order.order_status || "")
      .trim()
      .toLowerCase();

    acc[courierId].total += 1;

    if (
      normalizedStatus === "delivery" ||
      normalizedStatus === "out_for_delivery" ||
      normalizedStatus === "saiu_para_entrega"
    ) {
      acc[courierId].active += 1;
    }

    if (normalizedStatus === "delivered" || normalizedStatus === "entregue") {
      acc[courierId].delivered += 1;
    }

    return acc;
  }, {});
}

function buildLatestTrackingByCourier(trackingRows) {
  return (trackingRows ?? []).reduce((acc, item) => {
    const courierId = String(item.courier_id || "").trim();
    if (!courierId) return acc;

    if (!acc[courierId]) {
      acc[courierId] = item;
    }

    return acc;
  }, {});
}

function formatDateTime(value) {
  if (!value) return "Sem atualização";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Data inválida";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}

function formatCoordinate(value) {
  const numeric = Number(value);
  if (Number.isNaN(numeric)) return "—";
  return numeric.toFixed(6);
}

function pickActiveOrderForCourier(orders, courierId) {
  return (
    (orders ?? []).find((order) => {
      const assignedCourierId = String(order.delivery_user_id || "").trim();
      const normalizedStatus = String(order.order_status || "")
        .trim()
        .toLowerCase();

      return (
        assignedCourierId === String(courierId || "").trim() &&
        (normalizedStatus === "delivery" ||
          normalizedStatus === "out_for_delivery" ||
          normalizedStatus === "saiu_para_entrega")
      );
    }) || null
  );
}

export default function DeliveryUsersSection() {
  const [deliveryUsers, setDeliveryUsers] = useState([]);
  const [courierOrderStats, setCourierOrderStats] = useState({});
  const [courierLocations, setCourierLocations] = useState({});
  const [activeOrdersByCourier, setActiveOrdersByCourier] = useState({});
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [search, setSearch] = useState("");
  const [updatingId, setUpdatingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creatingUser, setCreatingUser] = useState(false);
  const [createForm, setCreateForm] = useState(initialCreateForm);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);

  const [mapModalOpen, setMapModalOpen] = useState(false);
  const [selectedCourierForMap, setSelectedCourierForMap] = useState(null);

  const loadDeliveryUsers = useCallback(async () => {
    setLoading(true);

    try {
      const [
        { data: profilesData, error: profilesError },
        { data: ordersData, error: ordersError },
        { data: trackingData, error: trackingError },
      ] = await Promise.all([
        supabase
          .from("profiles")
          .select("id, name, role, created_at, is_active")
          .eq("role", "delivery")
          .order("created_at", { ascending: false }),
        supabase
          .from("orders")
          .select(`
            id,
            delivery_user_id,
            order_status,
            customer_name,
            delivery_lat,
            delivery_lng
          `),
        supabase
          .from("order_delivery_tracking")
          .select("id, order_id, courier_id, latitude, longitude, created_at")
          .order("created_at", { ascending: false }),
      ]);

      if (profilesError) throw profilesError;
      if (ordersError) throw ordersError;
      if (trackingError) throw trackingError;

      const safeUsers = (profilesData ?? []).map((item) => ({
        ...item,
        is_active: item.is_active ?? true,
      }));

      const safeOrders = ordersData ?? [];

      const nextActiveOrdersByCourier = safeUsers.reduce((acc, user) => {
        acc[user.id] = pickActiveOrderForCourier(safeOrders, user.id);
        return acc;
      }, {});

      setDeliveryUsers(safeUsers);
      setCourierOrderStats(buildOrdersStatsByCourier(safeOrders));
      setCourierLocations(buildLatestTrackingByCourier(trackingData ?? []));
      setActiveOrdersByCourier(nextActiveOrdersByCourier);
      setMessage("");
    } catch (error) {
      console.error("Erro ao carregar motoboys:", error);
      setDeliveryUsers([]);
      setCourierOrderStats({});
      setCourierLocations({});
      setActiveOrdersByCourier({});
      setMessage(error?.message || "Não foi possível carregar os motoboys.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDeliveryUsers();

    const profilesChannel = supabase
      .channel("admin-delivery-users-profiles")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "profiles",
        },
        () => {
          loadDeliveryUsers();
        }
      )
      .subscribe();

    const ordersChannel = supabase
      .channel("admin-delivery-users-orders")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "orders",
        },
        () => {
          loadDeliveryUsers();
        }
      )
      .subscribe();

    const trackingChannel = supabase
      .channel("admin-delivery-users-tracking")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "order_delivery_tracking",
        },
        () => {
          loadDeliveryUsers();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(profilesChannel);
      supabase.removeChannel(ordersChannel);
      supabase.removeChannel(trackingChannel);
    };
  }, [loadDeliveryUsers]);

  useEffect(() => {
    if (!showCreateModal && !mapModalOpen) return;

    function handleEsc(event) {
      if (event.key !== "Escape") return;

      if (showCreateModal && !creatingUser) {
        handleCloseCreateModal();
      }

      if (mapModalOpen) {
        handleCloseMapModal();
      }
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", handleEsc);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleEsc);
    };
  }, [showCreateModal, creatingUser, mapModalOpen]);

  function handleOpenCreateModal() {
    setCreateForm(initialCreateForm);
    setShowCreateModal(true);
    setMessage("");
  }

  function handleCloseCreateModal() {
    if (creatingUser) return;
    setShowCreateModal(false);
    setCreateForm(initialCreateForm);
  }

  function handleCreateFormChange(event) {
    const { name, value } = event.target;

    setCreateForm((prev) => ({
      ...prev,
      [name]: name === "email" ? normalizeEmail(value) : value,
    }));
  }

  async function handleCreateDeliveryUser(event) {
    event.preventDefault();

    const payload = {
      name: String(createForm.name || "").trim(),
      email: normalizeEmail(createForm.email),
      password: String(createForm.password || "").trim(),
    };

    if (!payload.name) {
      setMessage("Preencha o nome do motoboy.");
      return;
    }

    if (!payload.email) {
      setMessage("Preencha o e-mail do motoboy.");
      return;
    }

    if (!payload.password || payload.password.length < 6) {
      setMessage("A senha temporária deve ter pelo menos 6 caracteres.");
      return;
    }

    setCreatingUser(true);
    setMessage("");

    try {
      const { data, error } = await supabase.functions.invoke(
        "create-delivery-user",
        {
          body: payload,
        }
      );

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setMessage("Motoboy criado com sucesso.");
      setShowCreateModal(false);
      setCreateForm(initialCreateForm);
      await loadDeliveryUsers();
    } catch (error) {
      console.error("Erro ao criar motoboy:", error);
      setMessage(error?.message || "Não foi possível criar o motoboy.");
    } finally {
      setCreatingUser(false);
    }
  }

  async function handleToggleActive(user) {
    setUpdatingId(user.id);
    setMessage("");

    try {
      const nextIsActive = !user.is_active;

      const { error } = await supabase
        .from("profiles")
        .update({
          is_active: nextIsActive,
        })
        .eq("id", user.id);

      if (error) throw error;

      setDeliveryUsers((prev) =>
        prev.map((item) =>
          item.id === user.id
            ? { ...item, is_active: nextIsActive }
            : item
        )
      );

      setMessage(
        nextIsActive
          ? "Motoboy ativado com sucesso."
          : "Motoboy desativado com sucesso."
      );
    } catch (error) {
      console.error("Erro ao atualizar motoboy:", error);
      setMessage("Não foi possível atualizar o motoboy.");
    } finally {
      setUpdatingId(null);
    }
  }

  function requestDeleteUser(user) {
    if (!user?.id) return;
    setUserToDelete(user);
    setConfirmOpen(true);
    setMessage("");
  }

  function closeDeleteDialog() {
    if (deletingId) return;
    setConfirmOpen(false);
    setUserToDelete(null);
  }

  async function confirmDeleteUser() {
    if (!userToDelete?.id) return;

    setDeletingId(userToDelete.id);
    setMessage("");

    try {
      const { data, error } = await supabase.functions.invoke(
        "delete-delivery-user",
        {
          body: {
            userId: userToDelete.id,
          },
        }
      );

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setDeliveryUsers((prev) =>
        prev.filter((item) => item.id !== userToDelete.id)
      );
      setCourierOrderStats((prev) => {
        const next = { ...prev };
        delete next[userToDelete.id];
        return next;
      });
      setCourierLocations((prev) => {
        const next = { ...prev };
        delete next[userToDelete.id];
        return next;
      });
      setActiveOrdersByCourier((prev) => {
        const next = { ...prev };
        delete next[userToDelete.id];
        return next;
      });

      if (selectedCourierForMap?.id === userToDelete.id) {
        setSelectedCourierForMap(null);
        setMapModalOpen(false);
      }

      setMessage("Motoboy excluído com sucesso.");
      setConfirmOpen(false);
      setUserToDelete(null);
    } catch (error) {
      console.error("Erro ao excluir motoboy:", error);
      setMessage(error?.message || "Não foi possível excluir o motoboy.");
    } finally {
      setDeletingId(null);
    }
  }

  function handleOpenMapModal(user) {
    setSelectedCourierForMap(user);
    setMapModalOpen(true);
  }

  function handleCloseMapModal() {
    setMapModalOpen(false);
    setSelectedCourierForMap(null);
  }

  const filteredUsers = useMemo(() => {
    const term = search.trim().toLowerCase();

    if (!term) return deliveryUsers;

    return deliveryUsers.filter((user) =>
      String(user.name || "").toLowerCase().includes(term)
    );
  }, [deliveryUsers, search]);

  const stats = useMemo(() => {
    return {
      total: deliveryUsers.length,
      active: deliveryUsers.filter((user) => user.is_active).length,
      inactive: deliveryUsers.filter((user) => !user.is_active).length,
    };
  }, [deliveryUsers]);

  const selectedCourierLocation = selectedCourierForMap
    ? courierLocations[selectedCourierForMap.id] || null
    : null;

  const selectedCourierActiveOrder = selectedCourierForMap
    ? activeOrdersByCourier[selectedCourierForMap.id] || null
    : null;

  const selectedCourierLatitude = selectedCourierLocation?.latitude ?? null;
  const selectedCourierLongitude = selectedCourierLocation?.longitude ?? null;
  const selectedCustomerLatitude =
    selectedCourierActiveOrder?.delivery_lat ?? null;
  const selectedCustomerLongitude =
    selectedCourierActiveOrder?.delivery_lng ?? null;

  return (
    <>
      <AdminContentHeader
        kicker="Operação"
        title="Motoboys"
        subtitle="Gerencie entregadores, acompanhe acessos, pedidos e localização em tempo real."
      />

      <section className={styles.content}>
        <div className={styles.container}>
          {message ? (
            <p className={styles.pageMessage} role="status">
              {message}
            </p>
          ) : null}

          <div className={styles.toolbar}>
            <button
              type="button"
              className={styles.primaryActionButton}
              onClick={handleOpenCreateModal}
            >
              + Novo motoboy
            </button>
          </div>

          <div className={styles.statsGrid}>
            <article className={styles.statCard}>
              <span>Total</span>
              <strong>{stats.total}</strong>
            </article>

            <article className={styles.statCard}>
              <span>Ativos</span>
              <strong>{stats.active}</strong>
            </article>

            <article className={styles.statCard}>
              <span>Inativos</span>
              <strong>{stats.inactive}</strong>
            </article>
          </div>

          <div className={styles.customerSearchBar}>
            <input
              type="text"
              className={styles.customerSearchInput}
              placeholder="Buscar motoboy por nome"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {loading ? (
            <div className={styles.emptyState}>
              <p>Carregando motoboys...</p>
            </div>
          ) : !filteredUsers.length ? (
            <div className={styles.emptyState}>
              <p>Nenhum motoboy encontrado.</p>
            </div>
          ) : (
            <div className={styles.customerGrid}>
              {filteredUsers.map((user) => {
                const orderStats = courierOrderStats[user.id] || {
                  total: 0,
                  active: 0,
                  delivered: 0,
                };

                const location = courierLocations[user.id] || null;
                const activeOrder = activeOrdersByCourier[user.id] || null;

                const isBusy =
                  updatingId === user.id || deletingId === user.id;

                return (
                  <article key={user.id} className={styles.customerCard}>
                    <div className={styles.customerHeader}>
                      <div>
                        <h3 className={styles.customerTitle}>
                          {user.name || "Motoboy sem nome"}
                        </h3>
                        <p className={styles.customerSubtext}>
                          Perfil: {user.role || "delivery"}
                        </p>
                      </div>

                      <span
                        className={`${styles.categoryStatus} ${
                          user.is_active
                            ? styles.categoryStatusActive
                            : styles.categoryStatusInactive
                        }`}
                      >
                        {user.is_active ? "Ativo" : "Inativo"}
                      </span>
                    </div>

                    <div className={styles.customerInfoGrid}>
                      <div className={styles.customerInfoBlock}>
                        <span className={styles.customerInfoLabel}>ID</span>
                        <strong className={styles.breakText}>{user.id}</strong>
                      </div>

                      <div className={styles.customerInfoBlock}>
                        <span className={styles.customerInfoLabel}>Função</span>
                        <strong>{user.role || "delivery"}</strong>
                      </div>

                      <div className={styles.customerInfoBlock}>
                        <span className={styles.customerInfoLabel}>Pedidos</span>
                        <strong>{orderStats.total}</strong>
                      </div>

                      <div className={styles.customerInfoBlock}>
                        <span className={styles.customerInfoLabel}>Em rota</span>
                        <strong>{orderStats.active}</strong>
                      </div>

                      <div
                        className={`${styles.customerInfoBlock} ${styles.customerInfoBlockWide}`}
                      >
                        <span className={styles.customerInfoLabel}>Entregues</span>
                        <strong>{orderStats.delivered}</strong>
                      </div>
                    </div>

                    <div className={styles.customerInfoGrid}>
                      <div
                        className={`${styles.customerInfoBlock} ${styles.customerInfoBlockWide}`}
                      >
                        <span className={styles.customerInfoLabel}>
                          Localização atual
                        </span>

                        {location ? (
                          <>
                            <strong className={styles.breakText}>
                              {formatCoordinate(location.latitude)},{" "}
                              {formatCoordinate(location.longitude)}
                            </strong>
                            <span className={styles.customerSubtext}>
                              Atualizado em {formatDateTime(location.created_at)}
                            </span>
                          </>
                        ) : (
                          <strong>Sem localização disponível</strong>
                        )}
                      </div>

                      <div
                        className={`${styles.customerInfoBlock} ${styles.customerInfoBlockWide}`}
                      >
                        <span className={styles.customerInfoLabel}>
                          Entrega atual
                        </span>
                        <strong>
                          {activeOrder?.customer_name || "Nenhuma entrega em rota"}
                        </strong>
                      </div>
                    </div>

                    {location ? (
                      <div className={styles.categoryActions}>
                        <button
                          type="button"
                          className={styles.secondaryActionButton}
                          onClick={() => handleOpenMapModal(user)}
                        >
                          Abrir mapa
                        </button>
                      </div>
                    ) : null}

                    <div className={styles.categoryActions}>
                      <button
                        type="button"
                        className={styles.secondaryActionButton}
                        onClick={() => handleToggleActive(user)}
                        disabled={isBusy}
                      >
                        {updatingId === user.id
                          ? "Atualizando..."
                          : user.is_active
                            ? "Desativar"
                            : "Ativar"}
                      </button>

                      <button
                        type="button"
                        className={styles.secondaryActionButton}
                        onClick={() => requestDeleteUser(user)}
                        disabled={isBusy}
                      >
                        {deletingId === user.id ? "Excluindo..." : "Excluir"}
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </section>

      <ConfirmDialog
        open={confirmOpen}
        title="Excluir motoboy"
        description={`Tem certeza que deseja excluir "${
          userToDelete?.name || "este motoboy"
        }"? Essa ação remove o acesso da plataforma.`}
        confirmText="Excluir"
        cancelText="Cancelar"
        onConfirm={confirmDeleteUser}
        onCancel={closeDeleteDialog}
        loading={deletingId != null}
      />

      {showCreateModal ? (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9999,
            background: "rgba(15, 23, 42, 0.55)",
            backdropFilter: "blur(6px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
          }}
          onClick={handleCloseCreateModal}
        >
          <div
            style={{
              width: "100%",
              maxWidth: "520px",
              background: "#ffffff",
              borderRadius: "20px",
              padding: "24px",
              boxShadow: "0 24px 60px rgba(15, 23, 42, 0.25)",
              border: "1px solid #e5e7eb",
            }}
            onClick={(event) => event.stopPropagation()}
          >
            <h3 style={{ marginTop: 0, marginBottom: "10px" }}>
              Novo motoboy
            </h3>

            <p
              style={{
                marginTop: 0,
                marginBottom: "20px",
                color: "#4b5563",
                lineHeight: 1.5,
              }}
            >
              Crie um novo acesso de motoboy para entrar na plataforma.
            </p>

            <form
              className={styles.productForm}
              onSubmit={handleCreateDeliveryUser}
            >
              <div className={styles.formGrid}>
                <input
                  type="text"
                  name="name"
                  placeholder="Nome do motoboy"
                  value={createForm.name}
                  onChange={handleCreateFormChange}
                  required
                  disabled={creatingUser}
                />

                <input
                  type="email"
                  name="email"
                  placeholder="E-mail"
                  value={createForm.email}
                  onChange={handleCreateFormChange}
                  required
                  disabled={creatingUser}
                />

                <input
                  type="password"
                  name="password"
                  placeholder="Senha temporária"
                  value={createForm.password}
                  onChange={handleCreateFormChange}
                  required
                  minLength={6}
                  disabled={creatingUser}
                />
              </div>

              <div className={styles.formActions}>
                <button
                  type="button"
                  className={styles.secondaryActionButton}
                  onClick={handleCloseCreateModal}
                  disabled={creatingUser}
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  className={styles.primaryActionButton}
                  disabled={creatingUser}
                >
                  {creatingUser ? "Criando..." : "Criar motoboy"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {mapModalOpen ? (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9999,
            background: "rgba(15, 23, 42, 0.55)",
            backdropFilter: "blur(6px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
          }}
          onClick={handleCloseMapModal}
        >
          <div
            style={{
              width: "100%",
              maxWidth: "1100px",
              background: "#ffffff",
              borderRadius: "20px",
              padding: "24px",
              boxShadow: "0 24px 60px rgba(15, 23, 42, 0.25)",
              border: "1px solid #e5e7eb",
            }}
            onClick={(event) => event.stopPropagation()}
          >
            <div
              style={{
                display: "flex",
                alignItems: "flex-start",
                justifyContent: "space-between",
                gap: "16px",
                marginBottom: "18px",
              }}
            >
              <div>
                <h3 style={{ margin: 0 }}>
                  Mapa do motoboy{" "}
                  {selectedCourierForMap?.name || "Selecionado"}
                </h3>

                <p
                  style={{
                    marginTop: "8px",
                    marginBottom: 0,
                    color: "#4b5563",
                    lineHeight: 1.5,
                  }}
                >
                  {selectedCourierLocation
                    ? `Última atualização em ${formatDateTime(
                        selectedCourierLocation.created_at
                      )}`
                    : "Sem localização disponível."}
                </p>

                <p
                  style={{
                    marginTop: "6px",
                    marginBottom: 0,
                    color: "#4b5563",
                    lineHeight: 1.5,
                  }}
                >
                  {selectedCourierActiveOrder?.customer_name
                    ? `Entrega atual: ${selectedCourierActiveOrder.customer_name}`
                    : "Sem entrega em rota no momento."}
                </p>
              </div>

              <button
                type="button"
                className={styles.secondaryActionButton}
                onClick={handleCloseMapModal}
              >
                Fechar
              </button>
            </div>

            <MotoboyDeliveryMap
              courierLatitude={selectedCourierLatitude}
              courierLongitude={selectedCourierLongitude}
              customerLatitude={selectedCustomerLatitude}
              customerLongitude={selectedCustomerLongitude}
            />
          </div>
        </div>
      ) : null}
    </>
  );
}