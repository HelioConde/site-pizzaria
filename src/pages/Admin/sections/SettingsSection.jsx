import { useCallback, useEffect, useState } from "react";
import { supabase } from "../../../lib/supabase";
import AdminContentHeader from "../components/AdminContentHeader";
import styles from "../Admin.module.css";

const initialForm = {
  id: null,
  store_name: "",
  tagline: "",
  phone: "",
  whatsapp: "",
  email: "",
  city: "",
  address: "",
  instagram: "",
  delivery_fee: "",
  estimated_delivery_time: "",
};

function normalizeText(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function normalizePhone(value) {
  return String(value || "").replace(/[^\d()+\-\s]/g, "").trim();
}

function normalizeWhatsapp(value) {
  return String(value || "").replace(/[^\d]/g, "").trim();
}

function normalizeEmail(value) {
  return String(value || "").trim().toLowerCase();
}

function normalizeUrl(value) {
  return String(value || "").trim();
}

function normalizeMoneyValue(value) {
  if (value === "" || value == null) return "";

  const numeric = Number(value);

  if (Number.isNaN(numeric)) return "";

  return String(Math.max(0, numeric));
}

export default function SettingsSection() {
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const loadSettings = useCallback(async () => {
    setLoading(true);

    try {
      const { data, error } = await supabase
        .from("store_settings")
        .select("*")
        .limit(1)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setForm({
          id: data.id ?? null,
          store_name: data.store_name ?? "",
          tagline: data.tagline ?? "",
          phone: data.phone ?? "",
          whatsapp: data.whatsapp ?? "",
          email: data.email ?? "",
          city: data.city ?? "",
          address: data.address ?? "",
          instagram: data.instagram ?? "",
          delivery_fee:
            data.delivery_fee != null ? String(data.delivery_fee) : "",
          estimated_delivery_time: data.estimated_delivery_time ?? "",
        });
      } else {
        setForm(initialForm);
      }

      setMessage("");
    } catch (error) {
      console.error("Erro ao carregar configurações:", error);
      setMessage("Não foi possível carregar as configurações.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSettings();

    const channel = supabase
      .channel("admin-store-settings")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "store_settings",
        },
        () => {
          loadSettings();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadSettings]);

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((prev) => {
      let nextValue = value;

      if (name === "phone") {
        nextValue = normalizePhone(value);
      }

      if (name === "whatsapp") {
        nextValue = normalizeWhatsapp(value);
      }

      if (name === "email") {
        nextValue = normalizeEmail(value);
      }

      if (name === "instagram") {
        nextValue = normalizeUrl(value);
      }

      if (name === "delivery_fee") {
        nextValue = normalizeMoneyValue(value);
      }

      return {
        ...prev,
        [name]: nextValue,
      };
    });
  }

  async function handleSave(event) {
    event.preventDefault();

    const normalizedStoreName = normalizeText(form.store_name);

    if (!normalizedStoreName) {
      setMessage("Preencha o nome da loja.");
      return;
    }

    setSaving(true);
    setMessage("");

    try {
      const payload = {
        store_name: normalizedStoreName,
        tagline: normalizeText(form.tagline) || null,
        phone: normalizePhone(form.phone) || null,
        whatsapp: normalizeWhatsapp(form.whatsapp) || null,
        email: normalizeEmail(form.email) || null,
        city: normalizeText(form.city) || null,
        address: normalizeText(form.address) || null,
        instagram: normalizeUrl(form.instagram) || null,
        delivery_fee:
          form.delivery_fee !== "" ? Math.max(0, Number(form.delivery_fee)) : 0,
        estimated_delivery_time:
          normalizeText(form.estimated_delivery_time) || null,
        updated_at: new Date().toISOString(),
      };

      if (form.id) {
        const { error } = await supabase
          .from("store_settings")
          .update(payload)
          .eq("id", form.id);

        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from("store_settings")
          .insert(payload)
          .select()
          .single();

        if (error) throw error;

        if (data?.id) {
          setForm((prev) => ({
            ...prev,
            id: data.id,
          }));
        }
      }

      setMessage("Configurações salvas com sucesso.");
      await loadSettings();
    } catch (error) {
      console.error("Erro ao salvar configurações:", error);
      setMessage(error.message || "Não foi possível salvar as configurações.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <>
        <AdminContentHeader
          kicker="Administração"
          title="Configurações"
          subtitle="Centralize as informações da loja e personalize a operação."
        />

        <section className={styles.content}>
          <div className={styles.container}>
            <div className={styles.emptyState}>
              <p>Carregando configurações...</p>
            </div>
          </div>
        </section>
      </>
    );
  }

  return (
    <>
      <AdminContentHeader
        kicker="Administração"
        title="Configurações"
        subtitle="Centralize as informações da loja e personalize a operação."
      />

      <section className={styles.content}>
        <div className={styles.container}>
          {message ? (
            <p className={styles.pageMessage} role="status">
              {message}
            </p>
          ) : null}

          <form className={styles.settingsForm} onSubmit={handleSave}>
            <div className={styles.settingsGrid}>
              <label className={styles.settingsField}>
                <span>Nome da loja</span>
                <input
                  type="text"
                  name="store_name"
                  value={form.store_name}
                  onChange={handleChange}
                  placeholder="Base Studio Pizzas"
                  required
                />
              </label>

              <label className={styles.settingsField}>
                <span>Telefone</span>
                <input
                  type="text"
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  placeholder="(61) 99999-9999"
                />
              </label>

              <label className={styles.settingsField}>
                <span>WhatsApp</span>
                <input
                  type="text"
                  name="whatsapp"
                  value={form.whatsapp}
                  onChange={handleChange}
                  placeholder="5561999999999"
                />
              </label>

              <label className={styles.settingsField}>
                <span>E-mail</span>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="contato@seudominio.com"
                />
              </label>

              <label className={styles.settingsField}>
                <span>Cidade</span>
                <input
                  type="text"
                  name="city"
                  value={form.city}
                  onChange={handleChange}
                  placeholder="Brasília - DF"
                />
              </label>

              <label className={styles.settingsField}>
                <span>Endereço</span>
                <input
                  type="text"
                  name="address"
                  value={form.address}
                  onChange={handleChange}
                  placeholder="Endereço da loja"
                />
              </label>

              <label className={styles.settingsField}>
                <span>Instagram</span>
                <input
                  type="text"
                  name="instagram"
                  value={form.instagram}
                  onChange={handleChange}
                  placeholder="https://instagram.com/..."
                />
              </label>

              <label className={styles.settingsField}>
                <span>Taxa de entrega</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  name="delivery_fee"
                  value={form.delivery_fee}
                  onChange={handleChange}
                  placeholder="6.90"
                />
              </label>

              <label className={styles.settingsField}>
                <span>Tempo estimado</span>
                <input
                  type="text"
                  name="estimated_delivery_time"
                  value={form.estimated_delivery_time}
                  onChange={handleChange}
                  placeholder="35 a 45 min"
                />
              </label>

              <label
                className={`${styles.settingsField} ${styles.settingsFieldWide}`}
              >
                <span>Tagline</span>
                <textarea
                  name="tagline"
                  value={form.tagline}
                  onChange={handleChange}
                  placeholder="Descrição curta da loja"
                  rows={4}
                />
              </label>
            </div>

            <div className={styles.settingsActions}>
              <button
                type="submit"
                className={styles.primaryActionButton}
                disabled={saving}
              >
                {saving ? "Salvando..." : "Salvar configurações"}
              </button>
            </div>
          </form>
        </div>
      </section>
    </>
  );
}