import { Navigate, Outlet, useLocation } from "react-router-dom";


export function ProtectedRoute() {
  const location = useLocation();
  const accessToken = window.sessionStorage.getItem("medibook_access_token");

  if (!accessToken) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return <Outlet />;
}

