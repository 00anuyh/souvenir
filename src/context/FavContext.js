// src/context/FavContext.jsx
import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  useCallback,
} from "react";

const STORAGE_KEY = "souvenir_favs_v1";

const FavCtx = createContext(null);
export const useFavs = () => useContext(FavCtx);

// 즐겨찾기 스냅샷 정규화
function normalizeFavSnapshot(input) {
  if (!input) return null;
  const id = String(input.id ?? input.slug ?? input.key ?? "");
  if (!id) return null;

  const image =
    input.image ??
    input.src ??
    input.thumb ??
    (Array.isArray(input.gallery) ? input.gallery[0] : "") ??
    "";

  return {
    id,
    slug: String(input.slug ?? id),
    name: input.name ?? input.product?.name ?? "",
    price: input.price ?? input.product?.price ?? "",
    image,
    soldout: Boolean(input.soldout ?? input.product?.soldout),
  };
}

// 배열을 정규화 + 중복제거(id)해서 반환
function hydrateFromStorage(rawJson) {
  try {
    const arr = rawJson ? JSON.parse(rawJson) : [];
    if (!Array.isArray(arr)) return [];
    const map = new Map();
    for (const it of arr) {
      const snap = normalizeFavSnapshot(it);
      if (snap && snap.id) map.set(String(snap.id), snap);
    }
    return Array.from(map.values());
  } catch {
    return [];
  }
}

export function FavProvider({ children, startEmpty = false }) {
  // 초기 상태
  const [favs, setFavs] = useState(() => {
    if (startEmpty) return [];
    const raw = localStorage.getItem(STORAGE_KEY);
    return hydrateFromStorage(raw);
  });

  // 빠른 조회용 맵(id -> snapshot)
  const favMap = useMemo(() => {
    const m = new Map();
    for (const f of favs) if (f?.id) m.set(String(f.id), f);
    return m;
  }, [favs]);

  const hasFav = useCallback((id) => favMap.has(String(id)), [favMap]);

  const addFav = useCallback((item) => {
    setFavs((prev) => {
      const snap = normalizeFavSnapshot(item);
      if (!snap || !snap.id) return prev;
      if (prev.some((f) => String(f.id) === snap.id)) return prev;
      return [...prev, snap];
    });
  }, []);

  const removeFav = useCallback((id) => {
    setFavs((prev) => prev.filter((f) => String(f.id) !== String(id)));
  }, []);

  // 전체 비우기
  const clearFavs = useCallback(() => {
    setFavs([]);
  }, []);

  // id 또는 객체 모두 허용
  const toggleFav = useCallback((itemOrId) => {
    setFavs((prev) => {
      const id =
        typeof itemOrId === "object"
          ? String(itemOrId.id ?? itemOrId.slug ?? itemOrId.key ?? "")
          : String(itemOrId ?? "");
      if (!id) return prev;

      const exists = prev.some((f) => String(f.id) === id);
      if (exists) {
        return prev.filter((f) => String(f.id) !== id);
      }
      const snap =
        typeof itemOrId === "object"
          ? normalizeFavSnapshot(itemOrId)
          : { id, slug: id, name: "", price: "", image: "", soldout: false };
      if (!snap || !snap.id) return prev;
      return [...prev, snap];
    });
  }, []);

  // 저장
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(favs));
    } catch {
      // ignore
    }
  }, [favs]);

  // 탭 간 동기화
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key !== STORAGE_KEY) return;
      setFavs(hydrateFromStorage(e.newValue || "[]"));
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const value = useMemo(
    () => ({ favs, hasFav, addFav, removeFav, toggleFav, clearFavs }),
    [favs, hasFav, addFav, removeFav, toggleFav, clearFavs]
  );

  return <FavCtx.Provider value={value}>{children}</FavCtx.Provider>;
}
