// src/utils/cart.js
const STORAGE_KEY = "cart_v1";
export const CART_UPDATED_EVENT = "cart:updated";

/* ───────── 공통 유틸 ───────── */
export function parsePriceKRW(v) {
  if (typeof v === "number") return v;
  if (!v) return 0;
  const n = String(v).replace(/[^\d.-]/g, "");
  return Number(n || 0);
}

export function getCart() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveCart(cart) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
  // 다른 탭/컴포넌트와 동기화
  try {
    window.dispatchEvent(new CustomEvent(CART_UPDATED_EVENT, { detail: { cart } }));
  } catch { }
}

/** 외부에서 전체 교체 저장이 필요할 때 사용 (하위호환 유지) */
export function setCart(next) {
  const safe = Array.isArray(next) ? next : [];
  saveCart(safe);
  return safe;
}

/* ───────── Key 생성: 이미지 포함 여부 옵션 ─────────
   기본은 이미지까지 비교해 라인 분리(기존 v1 동작).
   includeThumb=false를 넘기면 이미지 미포함 키(v2 스타일) */
function mergeKey(item, { includeThumb = true } = {}) {
  const base = item.id || item.slug || item.sku || item.name || "";
  const opt = item.optionId ?? "base";
  // 절대/상대경로 상관없이 문자열 그대로 비교
  const pic = item.thumb ?? item.image ?? "";
  return includeThumb ? `${base}::${opt}::${pic}` : `${base}::${opt}`;
}

/* ───────── 장바구니 담기 ─────────
   - 동일 키면 수량 증가
   - qty 안전 보정
   - thumb는 image 대체 허용
   - 기존 v2 호출부 호환을 위해 includeThumb 옵션을 item에서 읽어줌 */
export function addToCart(item, qty = 1) {
  const cart = getCart();

  // item.includeThumb === false 로 주면 v2처럼 이미지 미포함 병합
  const key = mergeKey(item, { includeThumb: item?.includeThumb !== false });
  const idx = cart.findIndex((x) => x.key === key);

  const addQty = Math.max(1, qty | 0);

  if (idx >= 0) {
    cart[idx].qty = Math.max(1, (cart[idx].qty | 0) + addQty);
  } else {
    cart.push({
      key,
      id: item.id ?? null,
      slug: item.slug ?? null,
      name: item.name ?? "",
      price: Number(item.price ?? 0),              // 단가(옵션 포함)
      basePrice: Number(item.basePrice ?? item.price ?? 0),
      optionId: item.optionId ?? null,
      optionLabel: item.optionLabel ?? null,
      delivery: Number(item.delivery ?? 0),
      thumb: item.thumb ?? item.image ?? null,     // image 허용
      qty: addQty,
      addedAt: Date.now(),
    });
  }

  saveCart(cart);
  return cart;
}

export function clearCart() {
  saveCart([]);
}

/* 특정 key의 수량 설정 */
export function setQty(key, qty) {
  const cart = getCart();
  const idx = cart.findIndex((x) => x.key === key);
  if (idx >= 0) {
    cart[idx].qty = Math.max(1, qty | 0);
    saveCart(cart);
  }
  return cart;
}

/* 특정 key 삭제 */
export function removeByKey(key) {
  const cart = getCart().filter((x) => x.key !== key);
  saveCart(cart);
  return cart;
}

/* 여러 key 삭제 (v2 기능 유지) */
export function removeMany(keys = []) {
  if (!Array.isArray(keys) || keys.length === 0) return getCart();
  const set = new Set(keys);
  const next = getCart().filter((x) => !set.has(x.key));
  saveCart(next);
  return next;
}

/* 결제 태그 기록 (v2 기능 유지)
   - purchasedAt 없으면 현재 시각
   - orderId 저장 */
export function tagPurchased(keys = [], orderId, purchasedAt) {
  if (!Array.isArray(keys) || keys.length === 0) return getCart();
  const set = new Set(keys);
  const now = purchasedAt ?? Date.now();
  const next = getCart().map((it) =>
    set.has(it.key) ? { ...it, purchasedAt: now, lastOrderId: orderId } : it
  );
  saveCart(next);
  return next;
}

/* 총 수량 */
export function cartCount() {
  return getCart().reduce((s, x) => s + (x.qty || 0), 0);
}

/* ───────── 하위호환 Shim ─────────
   v2에서 key 생성이 `id|slug|sku|name + optionId`였던 코드가
   남아있어도 큰 문제 없게, 필요 시 쉽게 전환할 수 있도록 제공 */
export function makeKeyLikeV2(item) {
  return `${item.id || item.slug || item.sku || item.name || ""}|${item.optionId || ""}`;
}
