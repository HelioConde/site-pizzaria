import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../../lib/supabase";
import AdminContentHeader from "../components/AdminContentHeader";
import styles from "../Admin.module.css";

export default function DeliveryUsersSection() {
  const [deliveryUsers, setDeliveryUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [search, setSearch] = useState("");
  const [updatingId, setUpdatingId] = useState(null);

  async function loadDeliveryUsers() {
    setLoading(true);

    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, name, role, created_at, is_active")
        .eq("role", "delivery")
        .order("created_at", { ascending: false });

      if (error) throw error;

      const safeUsers = (data ?? []).map((item) => ({
        ...item,
        is_active: item.is_active ?? true,
      }));

      setDeliveryUsers(safeUsers);
      setMessage("");
    } catch (error) {
      console.error("Erro ao carregar motoboys:", error);
      setDeliveryUsers([]);
      setMessage("Não foi possível carregar os motoboys.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDeliveryUsers();

    const channel = supabase
      .channel("admin-delivery-users")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "profiles",
        },
        loadDeliveryUsers
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  async function handleToggleActive(user) {
    setUpdatingId(user.id);
    setMessage("");

    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          is_active: !user.is_active,
        })
        .eq("id", user.id);

      if (error) throw error;

      setDeliveryUsers((prev) =>
        prev.map((item) =>
          item.id === user.id
            ? { ...item, is_active: !item.is_active }
            : item
        )
      );

      setMessage(
        user.is_active
          ? "Motoboy desativado com sucesso."
          : "Motoboy ativado com sucesso."
      );
    } catch (error) {
      console.error("Erro ao atualizar motoboy:", error);
      setMessage("Não foi possível atualizar o motoboy.");
    } finally {
      setUpdatingId(null);
    }
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

  return (
    <>
      <AdminContentHeader
        kicker="Operação"
        title="Motoboys"
        subtitle="Gerencie entregadores, acompanhe acessos e mantenha a operação organizada."
      />

      <section className={styles.content}>
        <div className={styles.container}>
          {message ? (
            <p className={styles.pageMessage} role="status">
              {message}
            </p>
          ) : null}

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
              {filteredUsers.map((user) => (
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
                  </div>

                  <div className={styles.categoryActions}>
                    <button
                      type="button"
                      className={styles.secondaryActionButton}
                      onClick={() => handleToggleActive(user)}
                      disabled={updatingId === user.id}
                    >
                      {updatingId === user.id
                        ? "Atualizando..."
                        : user.is_active
                        ? "Desativar"
                        : "Ativar"}
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}