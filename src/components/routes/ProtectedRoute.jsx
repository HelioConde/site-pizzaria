import { Navigate, useLocation } from "react-router-dom";
import styles from "./ProtectedRoute.module.css";

function FullPageFeedback({
  title = "Carregando...",
  message = "Estamos verificando seu acesso.",
}) {
  return (
    <main className={styles.feedbackContainer}>
      <div className={styles.feedbackBox}>
        <h1 className={styles.feedbackTitle}>{title}</h1>
        <p className={styles.feedbackText}>{message}</p>
      </div>
    </main>
  );
}

function getFallbackRouteByRole(userRole) {
  if (userRole === "admin") return "/admin/dashboard";
  if (userRole === "delivery") return "/motoboy";
  return "/account";
}

export default function ProtectedRoute({
  isLoading = false,
  isAuthenticated = false,
  allowedRoles = [],
  userRole = "",
  redirectTo = "/auth",
  children,
}) {
  const location = useLocation();

  const safeAllowedRoles = Array.isArray(allowedRoles)
    ? allowedRoles.filter(Boolean)
    : [];

  const currentPath = `${location.pathname || ""}${location.search || ""}${
    location.hash || ""
  }`;

  if (isLoading) {
    return (
      <FullPageFeedback
        title="Carregando..."
        message="Estamos verificando seu acesso."
      />
    );
  }

  if (!isAuthenticated) {
    return (
      <Navigate
        to={redirectTo}
        replace
        state={{ from: currentPath }}
      />
    );
  }

  if (safeAllowedRoles.length > 0 && !safeAllowedRoles.includes(userRole)) {
    return <Navigate to={getFallbackRouteByRole(userRole)} replace />;
  }

  return children;
}