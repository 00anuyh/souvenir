// src/api/admin.js
const RAW = process.env.REACT_APP_API_BASE || "";
const API_BASE =
  (RAW && RAW.replace(/\/+$/, "")) ||
  (window?.location?.protocol === "https:" 
    ? "https://<render-도메인-여기에>"         // ← GH Pages에서 테스트면 이 주소로 교체
    : "http://localhost:3001");

async function parseJSON(res) {
  try { return await res.json(); } catch { return null; }
}

export async function adminLogin(email, password) {
  let res, data;
  try {
    res = await fetch(`${API_BASE}/api/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email, password }),
    });
  } catch {
    throw new Error('NETWORK_ERROR'); // Mixed Content/CORS/주소오류 등 네트워크 자체 실패
  }
  data = await parseJSON(res);

  if (!res.ok) {
    if (data?.error) throw new Error(data.error);  // INVALID_CREDENTIALS 등
    throw new Error(`HTTP_${res.status}`);
  }
  if (!data?.ok) throw new Error(data?.error || 'LOGIN_FAILED');
  return data.admin;
}

export async function fetchAdminMe() {
  try {
    const res = await fetch(`${API_BASE}/api/admin/me`, { credentials: 'include' });
    if (!res.ok) return null;
    const data = await parseJSON(res);
    return data?.ok ? data.admin : null;
  } catch { return null; }
}

export async function adminLogout() {
  try {
    await fetch(`${API_BASE}/api/admin/logout`, { method: 'POST', credentials: 'include' });
  } catch {}
}
