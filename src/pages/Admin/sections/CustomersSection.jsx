import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../../lib/supabase";
import AdminContentHeader from "../components/AdminContentHeader";
import styles from "../Admin.module.css";

function formatPrice(value) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(Number(value || 0));
}

function formatDate(value) {
  if (!value) return "Sem pedidos";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Data inválida";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}

function normalizeCustomerName(order) {
  return String(order.customer_name || "").trim() || "Cliente sem nome";
}

function normalizeCustomerEmail(order) {
  return String(order.customer_email || "").trim() || "Não informado";
}

function normalizeCustomerPhone(order) {
  return String(order.customer_phone || "").trim() || "Não informado";
}

function buildCustomerKey(order) {
  const userId = String(order.user_id || "").trim();
  const email = String(order.customer_email || "").trim().toLowerCase();
  const phone = String(order.customer_phone || "").replace(/\D/g, "");

  if (userId) return `user:${userId}`;
  if (email) return `email:${email}`;
  if (phone) return `phone:${phone}`;

  return `guest:${String(order.id)}`;
}

export default function CustomersSection() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [search, setSearch] = useState("");

  async function loadCustomers() {
    setLoading(true);

    try {
      const { data, error } = await supabase
        .from("orders")
        .select(`
          id,
          user_id,
          customer_name,
          customer_email,
          customer_phone,
          total,
          created_at
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const orders = data ?? [];

      const grouped = orders.reduce((acc, order) => {
        const key = buildCustomerKey(order);

        if (!acc[key]) {
          acc[key] = {
            id: key,
            user_id: order.user_id || null,
            name: normalizeCustomerName(order),
            email: normalizeCustomerEmail(order),
            phone: normalizeCustomerPhone(order),
            ordersCount: 0,
            totalSpent: 0,
            lastOrderAt: order.created_at || null,
          };
        }

        acc[key].ordersCount += 1;
        acc[key].totalSpent += Number(order.total || 0);

        const currentLastDate = acc[key].lastOrderAt
          ? new Date(acc[key].lastOrderAt).getTime()
          : 0;

        const nextDate = order.created_at
          ? new Date(order.created_at).getTime()
          : 0;

        if (nextDate > currentLastDate) {
          acc[key].lastOrderAt = order.created_at;
        }

        if (
          acc[key].name === "Cliente sem nome" &&
          normalizeCustomerName(order) !== "Cliente sem nome"
        ) {
          acc[key].name = normalizeCustomerName(order);
        }

        if (
          acc[key].email === "Não informado" &&
          normalizeCustomerEmail(order) !== "Não informado"
        ) {
          acc[key].email = normalizeCustomerEmail(order);
        }

        if (
          acc[key].phone === "Não informado" &&
          normalizeCustomerPhone(order) !== "Não informado"
        ) {
          acc[key].phone = normalizeCustomerPhone(order);
        }

        return acc;
      }, {});

      const normalizedCustomers = Object.values(grouped).sort((a, b) => {
        const dateA = a.lastOrderAt ? new Date(a.lastOrderAt).getTime() : 0;
        const dateB = b.lastOrderAt ? new Date(b.lastOrderAt).getTime() : 0;
        return dateB - dateA;
      });

      setCustomers(normalizedCustomers);
      setMessage("");
    } catch (error) {
      console.error("Erro ao carregar clientes:", error);
      setCustomers([]);
      setMessage("Não foi possível carregar os clientes.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCustomers();

    const channel = supabase
      .channel("admin-customers")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "orders",
        },
        loadCustomers
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const filteredCustomers = useMemo(() => {
    const term = search.trim().toLowerCase();

    if (!term) return customers;

    return customers.filter((customer) => {
      return (
        customer.name.toLowerCase().includes(term) ||
        customer.email.toLowerCase().includes(term) ||
        customer.phone.toLowerCase().includes(term)
      );
    });
  }, [customers, search]);

  const stats = useMemo(() => {
    return {
      totalCustomers: customers.length,
      totalOrders: customers.reduce(
        (acc, customer) => acc + customer.ordersCount,
        0
      ),
      totalRevenue: customers.reduce(
        (acc, customer) => acc + customer.totalSpent,
        0
      ),
      recurringCustomers: customers.filter(
        (customer) => customer.ordersCount > 1
      ).length,
    };
  }, [customers]);

  return (
    <>
      <AdminContentHeader
        kicker="Relacionamento"
        title="Clientes"
        subtitle="Consulte clientes que já compraram, acompanhe recorrência e visualize os principais dados de contato."
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
              <span>Clientes</span>
              <strong>{stats.totalCustomers}</strong>
            </article>

            <article className={styles.statCard}>
              <span>Pedidos</span>
              <strong>{stats.totalOrders}</strong>
            </article>

            <article className={styles.statCard}>
              <span>Recorrentes</span>
              <strong>{stats.recurringCustomers}</strong>
            </article>

            <article className={`${styles.statCard} ${styles.statCardWide}`}>
              <span>Total movimentado</span>
              <strong>{formatPrice(stats.totalRevenue)}</strong>
            </article>
          </div>

          <div className={styles.customerSearchBar}>
            <input
              type="text"
              className={styles.customerSearchInput}
              placeholder="Buscar por nome, e-mail ou telefone"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {loading ? (
            <div className={styles.emptyState}>
              <p>Carregando clientes...</p>
            </div>
          ) : !filteredCustomers.length ? (
            <div className={styles.emptyState}>
              <p>Nenhum cliente encontrado.</p>
            </div>
          ) : (
            <div className={styles.customerGrid}>
              {filteredCustomers.map((customer) => (
                <article key={customer.id} className={styles.customerCard}>
                  <div className={styles.customerHeader}>
                    <div>
                      <h3 className={styles.customerTitle}>{customer.name}</h3>
                      <p className={styles.customerSubtext}>{customer.email}</p>
                    </div>

                    <span className={styles.customerOrdersBadge}>
                      {customer.ordersCount} pedido
                      {customer.ordersCount > 1 ? "s" : ""}
                    </span>
                  </div>

                  <div className={styles.customerInfoGrid}>
                    <div className={styles.customerInfoBlock}>
                      <span className={styles.customerInfoLabel}>Telefone</span>
                      <strong>{customer.phone}</strong>
                    </div>

                    <div className={styles.customerInfoBlock}>
                      <span className={styles.customerInfoLabel}>Total gasto</span>
                      <strong>{formatPrice(customer.totalSpent)}</strong>
                    </div>

                    <div
                      className={`${styles.customerInfoBlock} ${styles.customerInfoBlockWide}`}
                    >
                      <span className={styles.customerInfoLabel}>Último pedido</span>
                      <strong>{formatDate(customer.lastOrderAt)}</strong>
                    </div>
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