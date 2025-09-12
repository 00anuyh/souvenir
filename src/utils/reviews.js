// /src/utils/reviews.js
const KEY_PREFIX = "reviews_v1:";
const DEVICE_KEY = "reviews_device_id_v1";

// 한 상품당 최대 보관 리뷰 수 (필요시 조정)
const MAX_REVIEWS_PER_PRODUCT = 50;

function getKey(productKey) {
  return `${KEY_PREFIX}${String(productKey || "")}`;
}

// 디바이스 고유 ID (비로그인 사용자 식별용)
function ensureDeviceId() {
  let id = localStorage.getItem(DEVICE_KEY);
  if (!id) {
    id = `dev_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
    localStorage.setItem(DEVICE_KEY, id);
  }
  return id;
}

export function getAuthorId() {
  return ensureDeviceId();
}

/** 리스트 정화: 사용자 리뷰만 남기고, 중복 id 제거 */
function sanitizeUserList(arr) {
  if (!Array.isArray(arr)) return [];
  // 사용자 리뷰의 최소 요건: id, authorId(작성자), createdAt
  const onlyUser = arr.filter(
    (it) =>
      it &&
      typeof it === "object" &&
      typeof it.id === "string" &&
      it.id.length > 0 &&
      typeof it.authorId === "string" &&
      it.authorId.length > 0 &&
      typeof it.createdAt === "string" &&
      it.createdAt.length > 0
  );
  // id 기준 dedupe
  const seen = new Set();
  const deduped = [];
  for (const it of onlyUser) {
    if (seen.has(it.id)) continue;
    seen.add(it.id);
    deduped.push(it);
  }
  return deduped;
}

/** 안전 setItem: 용량 초과 시 콜백으로 정리 전략 적용 */
function safeSetItem(key, makeValue, pruneStrategies = []) {
  let value = makeValue();
  try {
    localStorage.setItem(key, value);
    return true;
  } catch (e) {
    // 시도: 순차적으로 정리 전략 수행 후 재시도
    for (const prune of pruneStrategies) {
      const changed = prune();
      if (!changed) continue;
      try {
        value = makeValue();
        localStorage.setItem(key, value);
        return true;
      } catch (_) {
        // 다음 전략 시도
      }
    }
    return false;
  }
}

/** 저장된 리뷰 목록 불러오기 (사용자 리뷰만, 자동 정리) */
export function getReviewsFor(productKey) {
  const key = getKey(productKey);
  try {
    const raw = localStorage.getItem(key);
    const arr = raw ? JSON.parse(raw) : [];
    const cleaned = sanitizeUserList(arr);

    // 저장된 값에 기본리뷰가 섞여 있었다면 cleaned로 교체(자가치유)
    if ((Array.isArray(arr) ? arr.length : 0) !== cleaned.length) {
      try {
        localStorage.setItem(key, JSON.stringify(cleaned));
      } catch {
        // 저장 실패해도 반환은 cleaned
      }
    }
    return cleaned;
  } catch {
    return [];
  }
}

/** 리뷰 추가 + 전체 목록 반환 (용량 초과 시 자동 정리) */
export function addReviewFor(productKey, review) {
  const key = getKey(productKey);
  const baseList = getReviewsFor(productKey); // ← 이미 sanitize됨
  const list = baseList.slice(0, MAX_REVIEWS_PER_PRODUCT);

  const item = {
    id: `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    name: review.name || "회원님",
    stars: review.stars,          // "★★★☆☆"
    score: review.score,          // "3.0"
    excerpt: review.excerpt,
    thumb: review.thumb || "",    // dataURL (옵션)
    rating: review.rating || 0,   // 숫자 1~5
    createdAt: review.createdAt || new Date().toISOString(),
    authorId: review.authorId || ensureDeviceId(),
  };

  // 1) 기본 next
  let next = [item, ...list].slice(0, MAX_REVIEWS_PER_PRODUCT);

  const makeValue = () => JSON.stringify(next);

  const pruneStrategies = [
    // 2) 새 아이템의 thumb 제거
    () => {
      if (!next[0]) return false;
      if (next[0].thumb) {
        next = [{ ...next[0], thumb: "" }, ...next.slice(1)];
        return true;
      }
      return false;
    },
    // 3) 오래된 항목부터 thumb 제거
    () => {
      let changed = false;
      next = next.map((it, idx) => {
        if (!changed && it.thumb && idx > 0) {
          changed = true;
          return { ...it, thumb: "" };
        }
        return it;
      });
      return changed;
    },
    // 4) 오래된 항목부터 삭제
    () => {
      if (next.length > 1) {
        next = next.slice(0, next.length - 1);
        return true;
      }
      return false;
    },
  ];

  const ok = safeSetItem(key, makeValue, pruneStrategies);
  if (!ok) {
    // 저장 실패: 최소한 텍스트만이라도 유지하려고 마지막 시도
    next = [{ ...item, thumb: "" }, ...list].slice(0, MAX_REVIEWS_PER_PRODUCT);
    try {
      localStorage.setItem(key, JSON.stringify(next));
    } catch {
      // 정말로 저장 불가 → 기존 목록 반환 (미저장)
      return list;
    }
  }
  return next;
}

/** 리뷰 수정(작성자 본인만) + 전체 목록 반환 */
export function updateReviewFor(productKey, reviewId, updates, requesterId) {
  const key = getKey(productKey);
  let list = getReviewsFor(productKey); // sanitize된 목록

  list = list.map((it) => {
    if (it.id !== reviewId) return it;
    if (requesterId && it.authorId && it.authorId !== requesterId) return it;
    return {
      ...it,
      ...updates,
      id: it.id,
      createdAt: it.createdAt,
      authorId: it.authorId,
    };
  });

  // 저장 (실패하면 썸네일부터 정리)
  let next = list;
  const makeValue = () => JSON.stringify(next);
  const pruneStrategies = [
    () => {
      let changed = false;
      next = next.map((it) => {
        if (!changed && it.id === reviewId && it.thumb) {
          changed = true;
          return { ...it, thumb: "" };
        }
        return it;
      });
      return changed;
    },
    () => {
      let changed = false;
      next = next.map((it, idx) => {
        if (!changed && it.thumb && idx > 0) {
          changed = true;
          return { ...it, thumb: "" };
        }
        return it;
      });
      return changed;
    },
    () => {
      if (next.length > 1) {
        next = next.slice(0, next.length - 1);
        return true;
      }
      return false;
    },
  ];

  const ok = safeSetItem(key, makeValue, pruneStrategies);
  if (!ok) {
    // 실패 시 썸네일 제거 버전만 저장 시도
    next = list.map((it) => (it.id === reviewId ? { ...it, thumb: "" } : it));
    try {
      localStorage.setItem(key, JSON.stringify(next));
    } catch {
      // 저장 불가 → 기존 유지
      return getReviewsFor(productKey);
    }
  }
  return next;
}

/** 리뷰 삭제(작성자 본인만) + 전체 목록 반환 */
export function deleteReviewFor(productKey, reviewId, requesterId) {
  const key = getKey(productKey);
  const list = getReviewsFor(productKey); // sanitize된 목록
  let next = list.filter((it) => {
    if (it.id !== reviewId) return true;
    if (requesterId && it.authorId && it.authorId !== requesterId) return true;
    return false;
  });
  try {
    localStorage.setItem(key, JSON.stringify(next));
  } catch {
    // 실패해도 삭제된 목록은 메모리로 반환
  }
  return next;
}

/** (선택) 모두 지우기 */
export function clearReviewsFor(productKey) {
  localStorage.removeItem(getKey(productKey));
}
