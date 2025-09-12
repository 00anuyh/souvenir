// ✅ 기존 상수 유지 (베이스 키)
export const LS_REWARDS = "souvenirRewards_v1";
export const LS_SIGNUP_BONUS = "souvenirSignupBonusGiven_v1";
export const LS_PURCHASE_FLAG = "souvenirRecentPurchase";

// ✅ 사용자별 키 생성 유틸
const k = (base, uid) => `${base}:${uid}`;

// ✅ 반드시 uid를 받아서 동작하게 변경
export function getRewards(uid) {
  if (!uid) return { coupons: 0, points: 0, gifts: 0 };
  try {
    const raw = localStorage.getItem(k(LS_REWARDS, uid));
    const parsed = raw ? JSON.parse(raw) : {};
    return {
      coupons: Number(parsed.coupons) || 0,
      points: Number(parsed.points) || 0,
      gifts: Number(parsed.gifts) || 0,
    };
  } catch {
    return { coupons: 0, points: 0, gifts: 0 };
  }
}


/** 저장: 숫자 보장 */
export function setRewards(uid, next) {
  if (!uid) return;
  const safe = {
    coupons: Number(next?.coupons) || 0,
    points: Number(next?.points) || 0,
    gifts: Number(next?.gifts) || 0,
  };
  try {
    localStorage.setItem(k(LS_REWARDS, uid), JSON.stringify(safe));
  } catch { }
}
/** 내부 업데이트 헬퍼(원자적) */
function updateRewards(uid, updater) {
  const before = getRewards(uid);
  const after = updater(before);
  setRewards(uid, after);
  return after;
}

/** 증감 헬퍼들 */
export const addCoupons = (uid, n = 1) =>
  updateRewards(uid, (r) => ({
    ...r,
    coupons: Math.max(0, (Number(r.coupons) || 0) + Number(n)),
  }));


export const addPoints = (uid, n = 0) =>
  updateRewards(uid, (r) => ({ ...r, points: r.points + Number(n) }));

export const addGifts = (uid, n = 1) =>
  updateRewards(uid, (r) => ({ ...r, gifts: r.gifts + Number(n) }));

/** 회원가입 보너스(1회만) → points+1000, coupons+1 */
export function grantSignupBonusOnce(uid) {
  if (!uid) return false;
  const flag = k(LS_SIGNUP_BONUS, uid);
  if (localStorage.getItem(flag) === "1") return false; // 이미 지급
  addPoints(uid, 1000);
  addCoupons(uid, 1);
  localStorage.setItem(flag, "1");
  return true;
}

/** ✅ 적립금 차감: 실제로 차감된 금액을 반환 */
export function spendPoints(uid, amount = 0) {
  if (!uid) return 0;
  let used = 0;
  updateRewards(uid, (r) => {
    const have = Number(r.points) || 0;
    const want = Math.max(0, Number(amount) || 0);
    used = Math.min(have, want);
    return { ...r, points: have - used };
  });
  return used;

};



/** 결제 완료 시: 이벤트 1회 보상 허용 플래그 세팅 */
export function setPurchaseFlag(uid) {
  if (!uid) return;
  localStorage.setItem(k(LS_PURCHASE_FLAG, uid), "1");
}

/** 이벤트에서 보상 줄 때 소모(있으면 true) */
export function consumePurchaseFlagIfAny(uid) {
  if (!uid) return false;
  const key = k(LS_PURCHASE_FLAG, uid);
  if (localStorage.getItem(key) === "1") {
    localStorage.removeItem(key);
    return true;
  }
  return false;
}

const PURCHASE_TOKEN_KEY = "souvenir:purchaseToken";

/** 결제 완료 시 호출 (토큰 발급). ttlHours=24는 24시간 유효 */
export function markRecentPurchase(meta = {}, ttlHours = 24) {
  const now = Date.now();
  const expiresAt = now + ttlHours * 60 * 60 * 1000;
  const payload = { ...meta, purchasedAt: now, expiresAt };
  try {
    localStorage.setItem(PURCHASE_TOKEN_KEY, JSON.stringify(payload));
  } catch { }
}

/** 이벤트 입장 가능? (토큰 있고, 아직 유효?) */
export function hasValidRecentPurchase() {
  try {
    const raw = localStorage.getItem(PURCHASE_TOKEN_KEY);
    if (!raw) return false;
    const data = JSON.parse(raw);
    return typeof data?.expiresAt === "number" && data.expiresAt > Date.now();
  } catch {
    return false;
  }
}

/** 토큰 소모 (이벤트 시작 시 소비) */
export function consumeRecentPurchase() {
  try { localStorage.removeItem(PURCHASE_TOKEN_KEY); } catch { }
}

// ✅ 쿠폰 원장(상세 내역) 저장 키
export const LS_COUPONS = "souvenirCoupons_v1";
const ck = (uid) => `${LS_COUPONS}:${uid}`;

/** 쿠폰 원장 읽기 */
export function getCouponLedger(uid) {
  if (!uid) return [];
  try {
    return JSON.parse(localStorage.getItem(ck(uid))) || [];
  } catch {
    return [];
  }
}

/** 쿠폰 원장 저장 */
function setCouponLedger(uid, arr) {
  if (!uid) return;
  try {
    localStorage.setItem(ck(uid), JSON.stringify(arr));
  } catch { }
}

/** 쿠폰 목록(필터 옵션) */
export function listCoupons(uid, { includeUsed = true, excludeExpired = false } = {}) {
  const now = Date.now();
  return getCouponLedger(uid).filter((c) => {
    if (!includeUsed && c.used) return false;
    if (excludeExpired && new Date(c.expiresAt).getTime() <= now) return false;
    return true;
  });
}

/** 쿠폰 사용 처리(원장 + 리워드 카운트 동기화) */
export function markCouponUsed(uid, couponId) {
  if (!uid || !couponId) return false;
  const ledger = getCouponLedger(uid);
  const idx = ledger.findIndex((c) => c.id === couponId);
  if (idx < 0 || ledger[idx].used) return false;
  ledger[idx].used = true;
  ledger[idx].usedAt = new Date().toISOString();
  setCouponLedger(uid, ledger);
  // 보유 쿠폰 수 -1 (음수 방지)
  addCoupons(uid, -1);
  return true;
}

/**
 * ✅ 결제 1건에 대해 '수량 1개당 5%' 쿠폰 발급
 * - 각 라인아이템의 unitPrice * 5% → 금액(내림)
 * - 해당 라인의 수량(qty) 만큼 쿠폰 N장 발급
 * - 기본 만료 60일
 */
export function issueCouponsForOrder(
  uid,
  { orderId, items, rate = 0.05, expiresInDays = 60 }
) {
  if (!uid || !orderId || !Array.isArray(items)) return { issued: 0, coupons: [] };
  const now = Date.now();
  const expiresAt = new Date(now + expiresInDays * 86400000).toISOString();

  const ledger = getCouponLedger(uid);
  let issued = 0;
  const added = [];

  items.forEach((it, lineIdx) => {
    const qty = Math.max(1, Number(it.qty || 1));
    const unitPrice = Math.max(0, Number(it.unitPrice ?? it.price ?? 0));
    const percent = Math.round((rate ?? 0.05) * 100);          // ✅ 5, 10 등 동적 계산
    for (let i = 0; i < qty; i++) {
      const amount = Math.floor(unitPrice * rate);
      if (amount <= 0) continue;
      const coupon = {
        id: `${orderId}-${lineIdx + 1}-${i + 1}`,
        title: `${(it.name || it.title || "상품")} ${percent}% 쿠폰`,
        percent,                                             // ✅ 필드명 통일
        amount,
        orderId,
        issuedAt: new Date(now).toISOString(),
        expiresAt,
        used: false,
        usedAt: null,
        meta: { productId: it.id ?? null, unitPrice, rate },
      };
      ledger.push(coupon);
      added.push(coupon);
      issued++;
    }
  });

  setCouponLedger(uid, ledger);
  if (issued > 0) addCoupons(uid, issued); // 리워드 카운트도 동기화
  return { issued, coupons: added };
}

/** ⚙️ 보유 개수와 원장 길이를 동기화(모달 열 때 호출) */
export function syncCouponLedgerWithCount(
  uid,
  { percent = 5, expiresInDays = 60, title = "이벤트 5% 쿠폰" } = {}
) {
  if (!uid) return [];
  const ledger = getCouponLedger(uid);
  const count = (getRewards(uid).coupons || 0);
  const diff = count - ledger.length;

  // 보유 개수 > 원장: 부족한 만큼 기본 쿠폰 생성
  if (diff > 0) {
    const now = Date.now();
    const expiresAt = new Date(now + expiresInDays * 86400000).toISOString();
    for (let i = 0; i < diff; i++) {
      ledger.push({
        id: `MIG-${now}-${i}`,
        title,
        percent,
        amount: null,                // 퍼센트 쿠폰
        orderId: null,
        issuedAt: new Date(now).toISOString(),
        expiresAt,
        used: false,
        usedAt: null,
        meta: { source: "migrated" },
      });
    }
    setCouponLedger(uid, ledger);
  }
  // 원장 > 보유 개수: 보유 개수를 원장 길이에 맞춰 보정
  else if (diff < 0) {
    addCoupons(uid, diff); // diff는 음수 → 개수 줄이기
  }
  return ledger;
}

/** 🎟 이벤트로 쿠폰 1장 발급(원장 + 카운트 동시 반영) */
export function grantEventCoupon(
  uid,
  { percent = 5, expiresInDays = 60, title = "이벤트 5% 쿠폰" } = {}
) {
  if (!uid) return null;
  const now = Date.now();
  const expiresAt = new Date(now + expiresInDays * 86400000).toISOString();
  const ledger = getCouponLedger(uid);
  const coupon = {
    id: `EVT-${now}-${Math.random().toString(36).slice(2, 8)}`,
    title,
    percent,
    amount: null,
    orderId: null,
    issuedAt: new Date(now).toISOString(),
    expiresAt,
    used: false,
    usedAt: null,
    meta: { source: "event" },
  };
  ledger.push(coupon);
  setCouponLedger(uid, ledger);
  addCoupons(uid, 1);
  return coupon;
}

