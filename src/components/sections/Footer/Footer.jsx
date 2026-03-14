import { useEffect, useMemo, useState } from "react";
import styles from "./Footer.module.css";
import { Instagram, Github, Linkedin, MessageCircle } from "lucide-react";
import { supabase } from "../../../lib/supabase";

function normalizeHours(value) {
  if (!value) return [];

  if (Array.isArray(value)) return value;

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export default function Footer({ footer }) {
  console.log("FOOTER props.footer:", footer);

  const [storeSettings, setStoreSettings] = useState(null);

  useEffect(() => {
    let active = true;

    async function loadStoreSettings() {
      try {
        const { data, error } = await supabase
          .from("store_settings")
          .select("*")
          .limit(1)
          .maybeSingle();

        console.log("FOOTER store_settings response:", data);

        if (error) throw error;

        if (active) {
          setStoreSettings(data ?? null);
        }
      } catch (error) {
        console.error("Erro ao carregar store_settings no footer:", error);
      }
    }

    loadStoreSettings();

    const channel = supabase
      .channel("footer-store-settings")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "store_settings",
        },
        loadStoreSettings
      )
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, []);

  console.log("FOOTER state.storeSettings:", storeSettings);

  const mergedStore = useMemo(() => {
    const merged = {
      name: storeSettings?.store_name || "Base Studio Pizzas",
      tagline: storeSettings?.tagline || "Sua pizzaria digital com experiência moderna.",
      phone: storeSettings?.phone || "(61) 99999-9999",
      whatsapp: storeSettings?.whatsapp || "5561999999999",
      email: storeSettings?.email || "contato@basestudiopizzas.com",
      city: storeSettings?.city || "Brasília - DF",
      address: storeSettings?.address || "Brasília - DF",
      instagram: storeSettings?.instagram || "",
      maps: {
        embedUrl: storeSettings?.maps_embed_url || "",
        openUrl: storeSettings?.maps_open_url || "",
      },
      hours: normalizeHours(storeSettings?.hours).length
        ? normalizeHours(storeSettings?.hours)
        : [
            { label: "Seg–Sex", value: "18h às 23h" },
            { label: "Sáb", value: "18h às 00h" },
            { label: "Dom", value: "17h às 23h" },
          ],
      socials: [
        storeSettings?.instagram
          ? { name: "Instagram", url: storeSettings.instagram }
          : null,
        storeSettings?.whatsapp
          ? { name: "WhatsApp", url: `https://wa.me/${storeSettings.whatsapp}` }
          : null,
      ].filter(Boolean),
    };

    console.log("FOOTER mergedStore:", merged);

    return merged;
  }, [storeSettings]);

  if (!footer) {
    console.log("FOOTER NÃO RENDERIZADO: footer da Home está vazio");
    return null;
  }

  const year = new Date().getFullYear();

  function getIcon(name) {
    switch (String(name || "").toLowerCase()) {
      case "instagram":
        return <Instagram size={18} />;
      case "github":
        return <Github size={18} />;
      case "linkedin":
        return <Linkedin size={18} />;
      case "whatsapp":
        return <MessageCircle size={18} />;
      default:
        return null;
    }
  }

  return (
    <footer className={styles.wrap} aria-label="Rodapé">
      <div className={styles.container}>
        <div className={styles.grid}>
          <div>
            <h4 className={styles.brand}>{mergedStore.name}</h4>
            <p className={styles.desc}>{mergedStore.tagline}</p>

            <ul className={styles.contact}>
              <li>📞 {mergedStore.phone || "Não informado"}</li>
              <li>✉️ {mergedStore.email || "Não informado"}</li>
              <li>📍 {mergedStore.city || mergedStore.address || "Não informado"}</li>
            </ul>
          </div>

          <div>
            <h5 className={styles.colTitle}>Redes</h5>

            <div className={styles.socials}>
              {(mergedStore.socials ?? []).map((social) => (
                <a
                  key={`${social.name}-${social.url}`}
                  className={styles.social}
                  href={social.url}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={social.name}
                  title={social.name}
                >
                  {getIcon(social.name)}
                </a>
              ))}
            </div>
          </div>

          <div>
            <h5 className={styles.colTitle}>Horários</h5>

            <ul className={styles.hours}>
              {(mergedStore.hours ?? []).map((hour) => (
                <li key={hour.label}>
                  <span className={styles.hourLabel}>{hour.label}</span>
                  <span className={styles.hourValue}>{hour.value}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {mergedStore.maps?.embedUrl ? (
          <div className={styles.map}>
            <iframe
              title="Mapa"
              src={mergedStore.maps.embedUrl}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        ) : null}

        {mergedStore.maps?.openUrl ? (
          <div className={styles.mapLinkWrap}>
            <a
              href={mergedStore.maps.openUrl}
              target="_blank"
              rel="noreferrer"
              className={styles.mapLink}
            >
              Abrir localização no mapa
            </a>
          </div>
        ) : null}

        <div className={styles.copy}>
          © {year} {mergedStore.name} — Desenvolvido por{" "}
          {footer?.credits?.author || "Hélio Conde"} ·{" "}
          <span className={styles.copyMuted}>
            {footer?.credits?.note || "Projeto de portfólio."}
          </span>
        </div>
      </div>
    </footer>
  );
}