import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.jsx";
import "./styles/global.css";
import "leaflet/dist/leaflet.css";

const basePath = import.meta.env.BASE_URL || "/";
const params = new URLSearchParams(window.location.search);
const redirect = params.get("redirect");

function normalizeBasePath(path) {
  if (!path || typeof path !== "string") return "/";
  const trimmed = path.trim();
  if (!trimmed) return "/";
  return trimmed.endsWith("/") ? trimmed.slice(0, -1) || "/" : trimmed;
}

function normalizeRedirectPath(path) {
  if (!path || typeof path !== "string") return null;

  let normalized = path.trim();

  if (!normalized) return null;

  try {
    normalized = decodeURIComponent(normalized);
  } catch {
    return null;
  }

  if (!normalized.startsWith("/")) {
    normalized = `/${normalized}`;
  }

  if (normalized.startsWith("//")) {
    return null;
  }

  if (/^[a-zA-Z][a-zA-Z\d+\-.]*:/.test(normalized)) {
    return null;
  }

  return normalized;
}

const safeBasePath = normalizeBasePath(basePath);
const safeRedirect = normalizeRedirectPath(redirect);

if (safeRedirect) {
  const nextUrl =
    safeBasePath === "/" ? safeRedirect : `${safeBasePath}${safeRedirect}`;

  const currentHash = window.location.hash || "";
  const currentParams = new URLSearchParams(window.location.search);

  currentParams.delete("redirect");

  const remainingQuery = currentParams.toString();
  const hasQueryInRedirect = safeRedirect.includes("?");
  const separator = hasQueryInRedirect ? "&" : "?";

  const finalUrl = `${nextUrl}${
    remainingQuery ? `${separator}${remainingQuery}` : ""
  }${currentHash}`;

  window.history.replaceState(null, "", finalUrl);
}

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error('Elemento raiz com id "root" não foi encontrado.');
}

createRoot(rootElement).render(
  <StrictMode>
    <BrowserRouter basename={safeBasePath}>
      <App />
    </BrowserRouter>
  </StrictMode>
);