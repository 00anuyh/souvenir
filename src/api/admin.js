// src/api/admin.js
// ✅ REACT_APP_API_BASE가 있으면 그걸 쓰고, 없으면 로컬 기본값(3001) 사용
const RAW = process.env.REACT_APP_API_BASE || "";
const API_BASE = RAW.replace(/\/+$/, "") || "http://localhost:3001";

// (디버그용) 현재 붙는 API 베이스 확인에 유용
export const __API_BASE = API_BASE;

async function parseJSON(res) {
  try { return await res.json(); } catch { return null; }
}

export async function adminLogin(email, password) {
  let res, data;
  try {
    res = await fetch(`${API_BASE}/api/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include', // 쿠키 필수
      body: JSON.stringify({ email, password }),
    });
  } catch {
    // 네트워크 자체 실패(Mixed Content/CORS/주소오류 등)
    throw new Error('NETWORK_ERROR');
  }

  data = await parseJSON(res);

  if (!res.ok) {
    // 서버가 표준 에러 포맷을 준 경우 그대로 throw (예: INVALID_CREDENTIALS)
    if (data?.error) throw new Error(data.error);
    throw new Error(`HTTP_${res.status}`);
  }
  if (!data?.ok) throw new Error(data?.error || 'LOGIN_FAILED');

  return data.admin; // { email, role: 'admin' }
}

export async function fetchAdminMe() {
  try {
    const res = await fetch(`${API_BASE}/api/admin/me`, { credentials: 'include' });
    if (!res.ok) return null;
    const data = await parseJSON(res);
    return data?.ok ? data.admin : null;
  } catch {
    return null;
  }
}

export async function adminLogout() {
  try {
    await fetch(`${API_BASE}/api/admin/logout`, {
      method: 'POST',
      credentials: 'include',
    });
  } catch {
    // ignore
  }
}
