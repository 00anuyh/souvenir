// src/components/HeaderUserStatus.jsx
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";          // 일반 유저
import { useAdminAuth } from "../context/AdminAuthContext"; // 관리자(서버 세션)

export default function HeaderUserStatus({ className = "" }) {
  const nav = useNavigate();
  const { user, logout: userLogout } = useAuth() || {};
  const { admin, logout: adminLogout, checking } = useAdminAuth() || {};

  // 세션 확인 중이면 깜빡임 방지로 일단 비움
  if (checking) return <span className={className} />;

  // 1) 관리자 로그인 상태
  if (admin) {
    return (
      <span className={className} style={{ display: "inline-flex", gap: 10, alignItems: "center" }}>
        <Link to="/admin" style={{ textDecoration: "none" }}>
          <strong>관리자</strong>
        </Link>
        <button
          onClick={async () => { await adminLogout(); nav("/"); }}
          style={{ background: "none", border: "none", cursor: "pointer" }}
        >
          로그아웃
        </button>
      </span>
    );
  }

  // 2) 일반 유저 로그인 상태
  if (user?.name) {
    return (
      <span className={className} style={{ display: "inline-flex", gap: 10, alignItems: "center" }}>
        <span>{user.name}님</span>
        <button
          onClick={() => { userLogout?.(); nav("/"); }}
          style={{ background: "none", border: "none", cursor: "pointer" }}
        >
          로그아웃
        </button>
      </span>
    );
  }

  // 3) 비로그인 상태
  return (
    <Link className={className} to="/Login" style={{ textDecoration: "none" }}>
      로그인
    </Link>
  );
}
