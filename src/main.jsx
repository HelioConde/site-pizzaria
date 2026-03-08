import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.jsx";
import "./styles/global.css";

const basePath = import.meta.env.BASE_URL;
const params = new URLSearchParams(window.location.search);
const redirect = params.get("redirect");

if (redirect) {
  window.history.replaceState(null, "", `${basePath}${redirect}`);
}

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter basename={basePath}>
      <App />
    </BrowserRouter>
  </StrictMode>
);