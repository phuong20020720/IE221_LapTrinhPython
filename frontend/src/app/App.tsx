import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

import { CustomerLayout } from "./CustomerLayout";
import { ProtectedRoute } from "./ProtectedRoute";
import { AdminDashboardPage } from "../pages/AdminDashboardPage";
import { HomePage } from "../pages/HomePage";
import { LoginPage } from "../pages/LoginPage";
import { PlaceholderPage } from "../pages/PlaceholderPage";


export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<CustomerLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route
            path="/doctors"
            element={<PlaceholderPage title="Danh sách bác sĩ" />}
          />
          <Route
            path="/booking"
            element={<PlaceholderPage title="Đặt lịch khám" />}
          />
          <Route
            path="/lookup"
            element={<PlaceholderPage title="Tra cứu lịch hẹn" />}
          />
        </Route>
        <Route path="/login" element={<LoginPage />} />
        <Route element={<ProtectedRoute />}>
          <Route path="/admin" element={<AdminDashboardPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

