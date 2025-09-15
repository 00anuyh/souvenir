// src/context/AdminAuthContext.jsx
import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { adminLogin, fetchAdminMe, adminLogout } from '../api/admin';

const AdminAuthCtx = createContext(null);

export function AdminAuthProvider({ children }) {
  const [admin, setAdmin] = useState(null);
  const [checking, setChecking] = useState(true);

  // 앱 시작 시 쿠키 기반 세션 확인
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const me = await fetchAdminMe();
        if (mounted) setAdmin(me); // me or null
      } finally {
        if (mounted) setChecking(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const login = useCallback(async (email, password) => {
    const a = await adminLogin(email, password);
    setAdmin(a);
    return a;
  }, []);

  const logout = useCallback(async () => {
    await adminLogout();
    setAdmin(null);
  }, []);

  return (
    <AdminAuthCtx.Provider value={{ admin, checking, login, logout }}>
      {children}
    </AdminAuthCtx.Provider>
  );
}

export function useAdminAuth() {
  return useContext(AdminAuthCtx);
}
