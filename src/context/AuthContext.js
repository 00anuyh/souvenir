// src/context/AuthContext.jsx
import React, {
  createContext, useContext, useMemo, useState, useRef, useEffect,
} from "react";
import { clearSession } from "../utils/localStorage";

import {
  // ✅ ID 기반 userStore API 사용
  createUser,
  findUserByLoginId,
  getSessionUser,
  setSessionUser,
  anyAdminExists,
  updateUserRoleByLoginId,
} from "../utils/userStore";

/* ================== 상수/스토리지 키 ================== */
const STORAGE_KEY = "souvenir_auth_v1";   // 소셜/스냅샷 저장
const EVENT_KEY   = "souvenirEventResult";

/* ================== 컨텍스트 ================== */
const AuthCtx = createContext(null);
export const useAuth = () => useContext(AuthCtx);

/* ================== Provider ================== */
export function AuthProvider({ children }) {
  // 로그인 플래그들
  const [isLoggedIn, setIsLoggedIn] = useState({
    local: false, google: false, kakao: false, naver: false,
  });

  // 현재 사용자
  // 로컬: { provider:'local', uid, loginId, role, nickname, ... }
  // 소셜: { provider:'google'|'kakao'|'naver', name, email, ... }
  const [user, setUser] = useState(null);

  // 외부 SDK 핸들
  const naverInstanceRef = useRef(null);
  const setNaverInstance = (inst) => { naverInstanceRef.current = inst; };

  // ID 정규화
  const normId = (s) => (s || "").trim().toLowerCase();

  /* ============== 공통 유틸 ============== */
  const persistSnapshot = (nextLoggedIn, nextUser) => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ isLoggedIn: nextLoggedIn, user: nextUser })
      );
    } catch {}
  };

  const clearAppOnLogout = () => {
    try {
      localStorage.removeItem(EVENT_KEY);
      localStorage.removeItem(STORAGE_KEY);
    } catch {}
  };

  const isAdmin = user?.role === "admin";

  /* ============== 로컬(ID/비번) 로그인/회원가입 ============== */
  const loginLocal = async (id, password) => {
    const found = findUserByLoginId(normId(id));
    if (!found || found.password !== password) {
      throw new Error("아이디 또는 비밀번호가 올바르지 않습니다.");
    }
    // 세션/상태 업데이트
    setSessionUser(found);
    const mergedUser = { provider: "local", ...found };
    setUser(mergedUser);
    const nextLoggedIn = { ...isLoggedIn, local: true };
    setIsLoggedIn(nextLoggedIn);
    persistSnapshot(nextLoggedIn, mergedUser);
    return mergedUser;
  };

  const signupLocal = async ({ id, password, nickname }) => {
    const created = createUser({ loginId: normId(id), password, nickname, role: "user" });
    setSessionUser(created);
    const mergedUser = { provider: "local", ...created };
    setUser(mergedUser);
    const nextLoggedIn = { ...isLoggedIn, local: true };
    setIsLoggedIn(nextLoggedIn);
    persistSnapshot(nextLoggedIn, mergedUser);
    return mergedUser;
  };

  // 관리자 생성/승격 (데모용: 프론트에서 비밀코드 확인)
  const createAdmin = async ({ id, ID, password, secret }) => {
    const SETUP_SECRET =
      import.meta.env?.VITE_ADMIN_SETUP_SECRET ||
      process.env.REACT_APP_ADMIN_SETUP_SECRET ||
      "0520";

    if (!secret || secret !== SETUP_SECRET) {
      throw new Error("관리자 비밀코드가 올바르지 않습니다.");
    }

    const loginId = normId(id || ID);
    if (!loginId) throw new Error("관리자 아이디가 필요합니다.");

    if (!anyAdminExists()) {
      // 첫 관리자 생성
      return createUser({ loginId, password, role: "admin" });
    } else {
      // 이미 관리자가 있으면, 현재 로그인 사용자가 admin일 때만 추가 발급
      if (!isAdmin) throw new Error("관리자만 다른 관리자를 추가할 수 있습니다.");
      const existing = findUserByLoginId(loginId);
      return existing
        ? updateUserRoleByLoginId(loginId, "admin")
        : createUser({ loginId, password, role: "admin" });
    }
  };

  /* ============== 소셜 로그인 ============== */
  // 소셜 공통 로그인 진입점
  // ex) login("google", { name, email })
  const login = (provider, payload = {}) => {
    const nextLoggedIn = { ...isLoggedIn, [provider]: true, local: true };
    setIsLoggedIn(nextLoggedIn);
    const nextUser = { provider, ...payload };
    setUser(nextUser);
    // 로컬 세션은 소셜에 사용하지 않음
    persistSnapshot(nextLoggedIn, nextUser);
  };

  // 개별 로그아웃(로컬/소셜 공통)
  const logout = (provider = "local") => {
    try {
      const nextLoggedIn = { ...isLoggedIn, [provider]: false };
      // provider 하나만 끄더라도, 실제로는 local=false로 앱 로그아웃 처리
      nextLoggedIn.local = false;
      setIsLoggedIn(nextLoggedIn);
      setUser(null);
      // 로컬 세션 제거
      setSessionUser(null);
    } finally {
      clearAppOnLogout();
      clearSession?.(); // 프로젝트 유틸 초기화
    }
  };

  // 전체 로그아웃(소셜 SDK 포함)
  const logoutAll = async () => {
    try {
      setIsLoggedIn({ local: false, google: false, kakao: false, naver: false });
      setUser(null);
      localStorage.removeItem("google_email");

      // Google
      try {
        if (window.google?.accounts?.id) {
          window.google.accounts.id.disableAutoSelect();
          const email = localStorage.getItem("google_email");
          if (email) window.google.accounts.id.revoke(email, () => {});
        }
      } catch {}

      // Kakao
      try {
        if (window.Kakao?.Auth?.getAccessToken?.()) {
          await new Promise((res) => window.Kakao.Auth.logout(() => res()));
        }
      } catch {}

      // Naver
      try {
        const inst = naverInstanceRef.current;
        if (inst?.logout) inst.logout();
        if (window.naver_id_login?.logout) window.naver_id_login.logout();
      } catch {}
    } finally {
      clearAppOnLogout();
      setIsLoggedIn({});
      setUser(null);
      setSessionUser(null); // 로컬 세션도 정리
      clearSession?.();
    }
  };

  /* ============== 초기 복원 ============== */
  useEffect(() => {
    // 1순위: userStore 세션(로컬 로그인)
    const sessionUser = getSessionUser();
    if (sessionUser) {
      const mergedUser = { provider: "local", ...sessionUser };
      setUser(mergedUser);
      const nextLoggedIn = { local: true, google: false, kakao: false, naver: false };
      setIsLoggedIn(nextLoggedIn);
      persistSnapshot(nextLoggedIn, mergedUser);
      return;
    }

    // 2순위: 소셜 스냅샷
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
      if (saved?.isLoggedIn) setIsLoggedIn(saved.isLoggedIn);
      if (saved?.user) setUser(saved.user);
    } catch {}
  }, []);

  /* ============== 스냅샷 업데이트 ============== */
  useEffect(() => {
    persistSnapshot(isLoggedIn, user);
  }, [isLoggedIn, user]);

  /* ============== 탭 간 동기화 ============== */
  useEffect(() => {
    const onStorage = (e) => {
      // 로컬 세션(userStore)은 별도 처리(앱 재진입 시 getSessionUser 사용)
      if (e.key !== STORAGE_KEY) return;
      try {
        const saved = JSON.parse(e.newValue || "null");
        if (saved?.isLoggedIn) setIsLoggedIn(saved.isLoggedIn);
        if (saved?.user) setUser(saved.user);
      } catch {}
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  /* ============== value ============== */
  const value = useMemo(
    () => ({
      // 상태
      isLoggedIn,
      user,
      isAdmin,

      // 로컬 계정 (ID기반)
      loginLocal,    // (id, password)
      signupLocal,   // ({ id, password, nickname })

      // 소셜 계정
      login,         // login("google"| "kakao"| "naver", payload)
      logout,        // logout("google"| "kakao"| "naver"| "local")
      logoutAll,
      setNaverInstance,

      // 관리자
      createAdmin,   // ({ id|ID, password, secret })
    }),
    [isLoggedIn, user, isAdmin]
  );

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}
