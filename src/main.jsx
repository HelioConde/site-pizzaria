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
  if (!path) return "/";
  return path.endsWith("/") ? path.slice(0, -1) || "/" : path;
}

function normalizeRedirectPath(path) {
  if (!path || typeof path !== "string") return null;

  let normalized = path.trim();

  if (!normalized) return null;

  if (!normalized.startsWith("/")) {
    normalized = `/${normalized}`;
  }

  return normalized;
}

const safeBasePath = normalizeBasePath(basePath);
const safeRedirect = normalizeRedirectPath(redirect);

if (safeRedirect) {
  const nextUrl =
    safeBasePath === "/" ? safeRedirect : `${safeBasePath}${safeRedirect}`;

  window.history.replaceState(null, "", nextUrl);
}

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error('Elemento raiz com id "root" não foi encontrado.');
}

createRoot(rootElement).render(
  <StrictMode>
    <BrowserRouter basename={basePath}>
      <App />
    </BrowserRouter>
  </StrictMode>
);