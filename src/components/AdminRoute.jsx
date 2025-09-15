import { Navigate } from "react-router-dom";
import { useAdminAuth } from "../context/AdminAuthContext";

export default function AdminRoute({ children }) {
  const { admin, checking } = useAdminAuth();
  if (checking) return null;                 // 로딩 UI가 필요하면 간단 문구로 교체
  if (!admin) return <Navigate to="/admin/setup" replace />;
  return children;
}
