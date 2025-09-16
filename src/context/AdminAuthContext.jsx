// src/context/AdminAuthContext.jsx
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  adminLogin,
  fetchAdminMe,
  adminLogout,
  __API_BASE,
} from "../api/admin";

/**
 * Context shape
 * - admin: { email, role } | null
 * - loading: boolean
 * - error: string | null
 * - login(email, password)
 * - logout()
 * - refresh()
 * - isAuthed, isAdmin
 * - apiBase: string
 */
const AdminAuthContext = createContext(null);

export function AdminAuthProvider({ children }) {
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 앱 시작 시 세션 확인
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const me = await fetchAdminMe();
        if (!alive) return;
        setAdmin(me);
      } catch (e) {
        if (!alive) return;
        setAdmin(null);
        setError(e?.message || "SESSION_CHECK_FAILED");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const login = useCallback(async (email, password) => {
    try {
      setLoading(true);
      setError(null);
      const a = await adminLogin(email, password);
      setAdmin(a);
      return { ok: true };
    } catch (e) {
      const msg =
        e?.message === "INVALID_CREDENTIALS"
          ? "이메일 또는 비밀번호가 올바르지 않습니다."
          : e?.message === "NETWORK_ERROR"
          ? "서버에 접속할 수 없습니다. 주소/CORS/HTTPS 설정을 확인하세요."
          : e?.message || "LOGIN_FAILED";
      setAdmin(null);
      setError(msg);
      return { ok: false, error: msg };
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      setLoading(true);
      await adminLogout();
    } finally {
      setAdmin(null);
      setError(null);
      setLoading(false);
    }
  }, []);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      const me = await fetchAdminMe();
      setAdmin(me);
      setError(null);
    } catch (e) {
      setAdmin(null);
      setError(e?.message || "REFRESH_FAILED");
    } finally {
      setLoading(false);
    }
  }, []);

  const value = useMemo(
    () => ({
      admin,
      loading,
      error,
      login,
      logout,
      refresh,
      isAuthed: !!admin,
      isAdmin: admin?.role === "admin",
      apiBase: __API_BASE,
    }),
    [admin, loading, error, login, logout, refresh]
  );

  return (
    <AdminAuthContext.Provider value={value}>
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) throw new Error("useAdminAuth must be used within AdminAuthProvider");
  return ctx;
}
