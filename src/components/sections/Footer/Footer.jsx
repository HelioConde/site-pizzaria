import { useEffect, useMemo, useState } from "react";
import { Instagram, Github, Linkedin, MessageCircle } from "lucide-react";
import { supabase } from "../../../lib/supabase";
import styles from "./Footer.module.css";

function normalizeHours(value) {
  if (!value) return [];

  if (Array.isArray(value)) {
    return value.filter(
      (item) =>
        item &&
        typeof item === "object" &&
        (item.label || item.value)
    );
  }

  try {
    const parsed = JSON.parse(value);

    return Array.isArray(parsed)
      ? parsed.filter(
          (item) =>
            item &&
            typeof item === "object" &&
            (item.label || item.value)
        )
      : [];
  } catch {
    return [];
  }
}

function normalizeUrl(url) {
  if (!url || typeof url !== "string") return "";
  const trimmed = url.trim();

  if (!trimmed) return "";
  if (
    trimmed.startsWith("http://") ||
    trimmed.startsWith("https://") ||
    trimmed.startsWith("mailto:") ||
    trimmed.startsWith("tel:")
  ) {
    return trimmed;
  }

  return `https://${trimmed}`;
}

function normalizeWhatsApp(value) {
  if (!value || typeof value !== "string") return "";
  return value.replace(/\D/g, "");
}

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

export default function Footer({ footer }) {
  const [storeSettings, setStoreSettings] = useState(null);

  useEffect(() => {
    let isMounted = true;

    async function loadStoreSettings() {
      try {
        const { data, error } = await supabase
          .from("store_settings")
          .select("*")
          .limit(1)
          .maybeSingle();

        if (error) throw error;

        if (!isMounted) return;
        setStoreSettings(data ?? null);
      } catch (error) {
        console.error("Erro ao carregar store_settings no footer:", error);

        if (!isMounted) return;
        setStoreSettings(null);
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
        () => {
          loadStoreSettings();
        }
      )
      .subscribe();

    return () => {
      isMounted = false;
      supabase.removeChannel(channel);
    };
  }, []);

  const mergedStore = useMemo(() => {
    const normalizedHours = normalizeHours(storeSettings?.hours);
    const whatsapp = normalizeWhatsApp(storeSettings?.whatsapp);
    const instagram = normalizeUrl(storeSettings?.instagram);
    const mapsOpenUrl = normalizeUrl(storeSettings?.maps_open_url);

    return {
      name: storeSettings?.store_name || "Base Studio Pizzas",
      tagline:
        storeSettings?.tagline ||
        "Sua pizzaria digital com experiência moderna.",
      phone: storeSettings?.phone || "(61) 99999-9999",
      whatsapp,
      email: storeSettings?.email || "contato@basestudiopizzas.com",
      city: storeSettings?.city || "Brasília - DF",
      address: storeSettings?.address || "Brasília - DF",
      maps: {
        embedUrl: storeSettings?.maps_embed_url || "",
        openUrl: mapsOpenUrl,
      },
      hours: normalizedHours.length
        ? normalizedHours
        : [
            { label: "Seg–Sex", value: "18h às 23h" },
            { label: "Sáb", value: "18h às 00h" },
            { label: "Dom", value: "17h às 23h" },
          ],
      socials: [
        instagram
          ? { name: "Instagram", url: instagram }
          : null,
        whatsapp
          ? { name: "WhatsApp", url: `https://wa.me/${whatsapp}` }
          : null,
      ].filter(Boolean),
    };
  }, [storeSettings]);

  if (!footer) {
    return null;
  }

  const year = new Date().getFullYear();
  const creditsAuthor =
    footer?.credits?.author?.trim?.() || "Hélio Conde";
  const creditsNote =
    footer?.credits?.note?.trim?.() || "Projeto de portfólio.";

  return (
    <footer className={styles.wrap} aria-label="Rodapé">
      <div className={styles.container}>
        <div className={styles.grid}>
          <div className={styles.column}>
            <h4 className={styles.brand}>{mergedStore.name}</h4>
            <p className={styles.desc}>{mergedStore.tagline}</p>

            <ul className={styles.contact}>
              <li>📞 {mergedStore.phone || "Não informado"}</li>
              <li>✉️ {mergedStore.email || "Não informado"}</li>
              <li>
                📍 {mergedStore.city || mergedStore.address || "Não informado"}
              </li>
            </ul>
          </div>

          <div className={styles.column}>
            <h5 className={styles.colTitle}>Redes</h5>

            {(mergedStore.socials ?? []).length ? (
              <div className={styles.socials}>
                {mergedStore.socials.map((social) => (
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
            ) : (
              <p className={styles.emptyText}>Nenhuma rede disponível.</p>
            )}
          </div>

          <div className={styles.column}>
            <h5 className={styles.colTitle}>Horários</h5>

            <ul className={styles.hours}>
              {(mergedStore.hours ?? []).map((hour, index) => {
                const label =
                  typeof hour?.label === "string" && hour.label.trim()
                    ? hour.label.trim()
                    : `Horário ${index + 1}`;

                const value =
                  typeof hour?.value === "string" && hour.value.trim()
                    ? hour.value.trim()
                    : "Não informado";

                return (
                  <li key={`${label}-${index}`}>
                    <span className={styles.hourLabel}>{label}</span>
                    <span className={styles.hourValue}>{value}</span>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>

        {mergedStore.maps?.embedUrl ? (
          <div className={styles.map}>
            <iframe
              title="Mapa da loja"
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
          © {year} {mergedStore.name} — Desenvolvido por {creditsAuthor} ·{" "}
          <span className={styles.copyMuted}>{creditsNote}</span>
        </div>
      </div>
    </footer>
  );
}