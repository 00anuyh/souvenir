// src/utils/userStore.js
const USERS_KEY = "users_v1";
const SESSION_KEY = "session_v1";

export function loadUsers() {
  try { return JSON.parse(localStorage.getItem(USERS_KEY)) || []; }
  catch { return []; }
}
export function saveUsers(users) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

export function getSessionUser() {
  try { return JSON.parse(localStorage.getItem(SESSION_KEY)); }
  catch { return null; }
}
export function setSessionUser(user) {
  if (user) localStorage.setItem(SESSION_KEY, JSON.stringify(user));
  else localStorage.removeItem(SESSION_KEY);
}

// 아이디 정규화 (공백제거 + 소문자)
const norm = (s) => (s || "").trim().toLowerCase();

// 하위호환: 과거 email로 저장된 사용자도 아이디처럼 매칭
const pickLoginId = (u) => (u.loginId ?? u.email ?? "").toString();

export function findUserByLoginId(loginId) {
  const key = norm(loginId);
  return loadUsers().find((u) => norm(pickLoginId(u)) === key) || null;
}

export function anyAdminExists() {
  return loadUsers().some((u) => u.role === "admin");
}

export function createUser({ loginId, email, password, role = "user", nickname }) {
  const users = loadUsers();
  const idKey = norm(loginId || email); // email 넘어오면 하위호환
  if (!idKey) throw new Error("아이디가 필요합니다.");

  if (users.some((u) => norm(pickLoginId(u)) === idKey)) {
    throw new Error("이미 존재하는 아이디입니다.");
  }

  const newUser = {
    uid: crypto.randomUUID(),     // 내부 고유키(기존 id와 혼동 방지)
    loginId: idKey,               // ★ 로그인 식별자
    // email: optional (원하면 보관)
    password,                     // 데모: 평문. 실서비스는 해시 필수
    role,
    nickname: nickname || idKey,
    createdAt: Date.now(),
  };
  users.push(newUser);
  saveUsers(users);
  return newUser;
}

export function updateUserRoleByLoginId(loginId, role) {
  const users = loadUsers();
  const key = norm(loginId);
  const idx = users.findIndex((u) => norm(pickLoginId(u)) === key);
  if (idx === -1) throw new Error("사용자를 찾을 수 없습니다.");
  users[idx] = { ...users[idx], role };
  saveUsers(users);
  return users[idx];
}
