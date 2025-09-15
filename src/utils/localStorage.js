// src/utils/localStorage.js

// 모든 유저를 { [username]: user } 형태로 저장
const USERS_KEY = "souvenir_users_v1";
// 현재 로그인 세션 키 (다른 곳에서 쓰기 쉽게 export)
export const SESSION_KEY = "souvenir_session_v1";

/* ----------------------------- 유틸 ----------------------------- */
function safeParse(json, fallback) {
  try { return JSON.parse(json); } catch { return fallback; }
}
const hasLS = () => typeof localStorage !== "관리자";

/* -------------------------- Users CRUD -------------------------- */
function getUsersMap() {
  if (!hasLS()) return {};
  return safeParse(localStorage.getItem(USERS_KEY), {}) || {};
}
function setUsersMap(map) {
  if (!hasLS()) return;
  localStorage.setItem(USERS_KEY, JSON.stringify(map));
}

/** username으로 유저 한 명 가져오기 */
export function getFromLocalStorage(username) {
  if (!username) return null;
  const map = getUsersMap();
  return map[username] || null;
}

/** username으로 유저 저장(생성/업데이트) */
export function saveToLocalStorage(username, data) {
  const map = getUsersMap();
  map[username] = data; // ⚠️ 데모용: 비밀번호 평문 저장(실서비스 금지)
  setUsersMap(map);
}

/** 유저 삭제(옵션) */
export function removeFromLocalStorage(username) {
  const map = getUsersMap();
  if (map[username]) {
    delete map[username];
    setUsersMap(map);
  }
}

/* --------------------------- Session --------------------------- */
/** 세션 저장: { username, loginAt } */
export function setSession(username) {
  if (!hasLS()) return null;
  const s = { username, loginAt: Date.now() };
  localStorage.setItem(SESSION_KEY, JSON.stringify(s));
  return s;
}

/** 세션 조회(과거 userid 필드 → username으로 정규화) */
export function getSession() {
  if (!hasLS()) return null;
  const raw = localStorage.getItem(SESSION_KEY);
  if (!raw) return null;

  const s = safeParse(raw, null);
  if (!s) return null;

  if (s.username) return s;
  if (s.userid) return { ...s, username: s.userid };
  return s;
}

/** 세션 삭제 */
export function clearSession() {
  if (!hasLS()) return;
  localStorage.removeItem(SESSION_KEY);
}
