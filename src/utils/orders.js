// src/utils/orders.js

export const ORDERS_UPDATED_EVENT = "orders:updated";
const ORDERS_KEY = (uid) => `orders:${uid || "guest"}`;
export function loadOrders(uid) {
  try {
    const raw = localStorage.getItem(ORDERS_KEY(uid));
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

export function createOrderId() {
  const ts = Date.now();
  const rnd = Math.floor(Math.random() * 1e6);
  return `SOUV-${ts}-${rnd.toString().padStart(6, "0")}`;
}

/** 주문 저장(중복 orderId 있으면 교체, 없으면 prepend). 저장 후 이벤트 브로드캐스트 */
export function saveOrder(uid, order) {
  const list = loadOrders(uid);
  // 같은 orderId가 있으면 교체, 없으면 추가
  const i = list.findIndex((x) => x.orderId === order.orderId);
  if (i >= 0) list[i] = order; else list.push(order);

  // 날짜 내림차순 정렬
  list.sort((a, b) => new Date(b.date) - new Date(a.date));

  localStorage.setItem(ORDERS_KEY(uid), JSON.stringify(list));
  // 🔔 MyPage에 갱신 알림
  window.dispatchEvent(
    new CustomEvent(ORDERS_UPDATED_EVENT, { detail: { uid, orders: list } })
  );
}

export function clearOrders(uid) {
  localStorage.removeItem(ORDERS_KEY(uid));
}
