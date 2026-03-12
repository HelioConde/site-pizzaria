import { Navigate, useLocation } from "react-router-dom";

export default function ProtectedRoute({
  isLoading = false,
  isAuthenticated = false,
  allowedRoles = [],
  userRole = "",
  redirectTo = "/auth",
  children,
}) {
  const location = useLocation();

  if (isLoading) {
    return null;
  }

  if (!isAuthenticated) {
    return <Navigate to={redirectTo} replace state={{ from: location.pathname }} />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(userRole)) {
    return <Navigate to="/" replace />;
  }

  return children;
}