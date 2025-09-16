// src/api/admin.js
// 프론트에서 API 베이스를 유연하게 지정할 수 있도록
const RAW = process.env.REACT_APP_API_BASE || "";
const API_BASE = RAW.replace(/\/+$/, "") || "http://localhost:3001";
export const __API_BASE = API_BASE;

async function parseJSON(res) {
  try {
    return await res.json();
  } catch {
    return null;
  }
}

export async function adminLogin(email, password) {
  let res, data;
  try {
    res = await fetch(`${API_BASE}/api/admin/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include", // ★ 쿠키 왕복 필수
      body: JSON.stringify({ email, password }),
    });
  } catch {
    throw new Error("NETWORK_ERROR");
  }
  data = await parseJSON(res);
  if (!res.ok) {
    if (data?.error) throw new Error(data.error);
    throw new Error(`HTTP_${res.status}`);
  }
  if (!data?.ok) throw new Error(data?.error || "LOGIN_FAILED");
  return data.admin; // { email, role }
}

export async function fetchAdminMe() {
  try {
    const res = await fetch(`${API_BASE}/api/admin/me`, {
      credentials: "include", // ★ 중요
    });
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
      method: "POST",
      credentials: "include", // ★ 중요
    });
  } catch {
    // ignore
  }
}
