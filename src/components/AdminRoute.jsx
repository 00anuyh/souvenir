// src/routes/AdminRoute.jsx
import React from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAdminAuth } from "../context/AdminAuthContext";

export default function AdminRoute() {
  const { isAuthed, loading } = useAdminAuth();
  const loc = useLocation();

  if (loading) {
    return (
      <div style={{ padding: 24, textAlign: "center" }}>
        <span>Checking admin session…</span>
      </div>
    );
  }

  if (!isAuthed) {
    // 미로그인 → 로그인 페이지로
    return <Navigate to="/login" replace state={{ from: loc }} />;
  }

  return <Outlet />;
}
