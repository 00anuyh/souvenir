// src/pages/Lighting.jsx
import "../css/Lighting.css";

import React, {
  useEffect,
  useRef,
  useState,
  useMemo,
} from "react";
import { IoIosArrowDown } from "react-icons/io";
import { Link, useNavigate } from "react-router-dom";
import { useFavs } from "../context/FavContext";
import { addToCart, parsePriceKRW } from "../utils/cart";

// ✅ 상세 데이터 import (대표 이미지 매칭용)
import detailProducts from "../data/detailData.json";

/* ── 공용: 이미지 경로 정리 ── */
const resolveImg = (src) => {
  if (!src) return "/img/placeholder.png";
  if (/^https?:\/\//i.test(src)) return src;
  return src.startsWith("/")
    ? src
    : `${process.env.PUBLIC_URL}/${src.replace(/^\.?\//, "")}`;
};

/* ── 가격 포매터: 숫자/문자/undefined 모두 안전 처리 ── */
function formatPrice(value, { withSymbol = true } = {}) {
  if (value == null) return withSymbol ? "₩0" : "0";
  const num =
    typeof value === "number"
      ? value
      : Number(String(value).replace(/[^\d.-]/g, ""));
  if (!Number.isFinite(num)) return withSymbol ? "₩0" : "0";
  if (withSymbol) {
    return new Intl.NumberFormat("ko-KR", {
      style: "currency",
      currency: "KRW",
      maximumFractionDigits: 0,
    }).format(num);
  }
  return num.toLocaleString("ko-KR", { maximumFractionDigits: 0 });
}

export default function Lighting() {
  const heroRef = useRef(null);
  const [active, setActive] = useState(0);

  const images = useMemo(
    () =>
      Array.from(
        { length: 4 },
        (_, i) =>
          `https://00anuyh.github.io/SouvenirImg/L_ban1img${i + 1}.png`
      ),
    []
  );

  const heroMap = [0, 1, 2, 3];
  const triggersConf = useMemo(
    () =>
      Array.from({ length: 4 }, (_, i) => {
        const num = Math.floor(i / 2) + 1;
        const cls = i % 2 === 0 ? `decor decor-${num}` : `square square-${num}`;
        return {
          cls,
          src: `https://00anuyh.github.io/SouvenirImg/L_ban2img${i + 1}.png`,
          hero: heroMap[i],
        };
      }),
    []
  );

  // 레이아웃 계산은 layoutEffect로 (FOUC 방지)
  useEffect(() => {
    const scope = heroRef.current;
    if (!scope) return;

    let order = Array.from(scope.querySelectorAll(".decor, .square"));

    const BASE_RIGHT = 800;
    const CC_GAP = 60;

    const applyPositions = () => {
      const widths = order.map((el) => el.getBoundingClientRect().width);
      let r = BASE_RIGHT;

      order.forEach((el, i) => {
        if (i !== 0) {
          r += widths[i - 1] / 2 + widths[i] / 2 + CC_GAP;
        }
        el.style.position = "absolute";
        el.style.top = "50%";
        el.style.left = `${r}px`;
      });
    };

    applyPositions();

    const onClick = (e) => {
      const btn = e.target.closest(".decor, .square");
      if (!btn || !scope.contains(btn)) return;
      e.preventDefault();

      const to = Number(btn.dataset.hero);
      setActive((prev) =>
        Number.isNaN(to)
          ? (prev + 1) % images.length
          : ((to % images.length) + images.length) % images.length
      );

      order = Array.from(scope.querySelectorAll(".decor, .square")).sort(
        (a, b) => Number(a.dataset.order ?? 0) - Number(b.dataset.order ?? 0)
      );
      const idx = order.indexOf(btn);
      if (idx === -1) return;

      order = order.slice(idx).concat(order.slice(0, idx));
      applyPositions();
    };

    const onResize = () => applyPositions();

    // 이미지 로드/리사이즈 대응
    const imgs = scope.querySelectorAll(".decor img, .square img");
    const loaded = new Set();
    imgs.forEach((img) => {
      const handler = () => {
        if (loaded.has(img)) return;
        loaded.add(img);
        applyPositions();
      };
      img.addEventListener("load", handler, { once: true });
      if (img.complete) handler();
    });

    const ro = new ResizeObserver(() => applyPositions());
    ro.observe(scope);

    scope.addEventListener("click", onClick);
    window.addEventListener("resize", onResize);

    return () => {
      scope.removeEventListener("click", onClick);
      window.removeEventListener("resize", onResize);
      ro.disconnect();
    };
  }, [images.length]);

  return (
    <>
      <section className="hero" ref={heroRef}>
        <div className="container hero-grid">
          <figure className="hero-main">
            {images.map((src, i) => (
              <img
                key={src}
                src={src}
                alt={`hero ${i + 1}`}
                className={i === active ? "is-active" : ""}
              />
            ))}
          </figure>

          {triggersConf.map((t, i) => (
            <div key={i} className={t.cls} data-hero={t.hero} data-order={i}>
              <img src={t.src} alt="" />
            </div>
          ))}
        </div>
      </section>
      <ProductList />
    </>
  );
}

function ProductList() {
  const navigate = useNavigate();

  // ✅ 상세 JSON → slug: 대표이미지 매핑
  const galleryMap = useMemo(() => {
    const m = new Map();
    const arr = Array.isArray(detailProducts) ? detailProducts : [];
    for (const it of arr) {
      const slug = String(it?.id ?? "");
      const first = Array.isArray(it?.gallery) ? it.gallery[0] : "";
      if (slug && first) m.set(slug, resolveImg(first));
    }
    return m;
  }, []);

  // 조명 카테고리에서 상세 연결할 슬러그만 지정
  const DETAIL_SLUGS = ["lamp-amber-001", "lamp-amber-002"];

  // ✅ 리스트 생성: 앞쪽은 상세 연결+대표이미지, 나머지는 시퀀스+가짜ID
  const items = useMemo(() => {
    const TOTAL = 60;
    const list = [];

    for (let i = 0; i < TOTAL; i++) {
      const hasDetail = i < DETAIL_SLUGS.length; // 첫 N개만 상세 연결
      const detailSlug = hasDetail ? DETAIL_SLUGS[i] : null;

      const fallbackSrc = `https://00anuyh.github.io/SouvenirImg/L_sec1img${
        (i % 9) + 1
      }.png`;
      const realSrc = detailSlug ? galleryMap.get(detailSlug) : null;

      list.push({
        uiKey: `lighting-${i + 1}`, // ✅ React 렌더링 전용 키
        id: hasDetail ? detailSlug : `lighting-seq-${i + 1}`, // ✅ 카논 ID(상세 없으면 고유 가짜 ID)
        slug: detailSlug, // 상세 없으면 null
        name: "앰버 램프",
        price: "₩49,000",
        src: realSrc || fallbackSrc, // ✅ 상세 있으면 대표, 없으면 시퀀스
        matched: !!realSrc, // 스타일용
        soldout: i === 3 || i === 8 || i === 18 || i === 36,
      });
    }
    return list;
  }, [galleryMap]);

  const STEP = 8;
  const [showing, setShowing] = useState(STEP);
  const visible = items.slice(0, showing);

  // ✅ 즐겨찾기 컨텍스트
  const { hasFav, toggleFav } = useFavs();

  // ✅ 토스트(즐겨찾기)
  const [toast, setToast] = useState("");
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 1200);
    return () => clearTimeout(t);
  }, [toast]);

  // ✅ 장바구니 모달
  const [showModal, setShowModal] = useState(false);

  // ✅ 장바구니 담기 (Objects/LifeStyle와 동일)
  const handleAdd = (p) => (e) => {
    e.preventDefault();
    e.stopPropagation();

    const basePrice = parsePriceKRW(p.price);
    addToCart(
      {
        id: p.id, // 상세 없으면 lighting-seq-N
        slug: p.slug ?? undefined,
        name: p.name,
        price: basePrice,
        basePrice,
        optionId: null,
        optionLabel: "기본 구성",
        thumb: p.src, // 이미지가 다르면 병합키가 달라짐
        delivery: 0,
      },
      1
    );

    setShowModal(true);
  };

  return (
    <section className="section">
      <div className="container">
        <div className="toptitle">
          <div className="titleleft" />
          <h2>LIGHTING</h2>
          <div className="titleright" />
        </div>

        <ul className="product-grid">
          {visible.map((p) => {
            const isFav = hasFav(p.id);

            // 👇 클릭(링크) 가능 여부와 품절 여부를 분리
            const hasDetail = !!p.slug;        // 상세 페이지로 이동 가능?
            const isSoldOut = !!p.soldout;     // 품절?

            // 상세가 있을 때만 Link, 없으면 div (← “준비중”과 “품절”을 구분)
            const MediaWrap = hasDetail ? Link : "div";
            const mediaProps = hasDetail
              ? { to: `/detail/${p.slug}`, className: "product-media" }
              : {
                  className: "product-media",
                  onClick: (e) => e.preventDefault(),
                  title: "상세 페이지 준비중입니다",
                };

            return (
              <li
                className={`product-card ${p.matched ? "matched" : ""}`}
                key={p.uiKey}
                data-soldout={isSoldOut ? "true" : "false"}
              >
                <MediaWrap {...mediaProps}>
                  <img src={p.src} alt={p.name} loading="lazy" />
                  {isSoldOut && <span className="badge soldout" aria-hidden="true" />}

                  <div className="product-caption">
                    <span className="product-name">{p.name}</span>
                    <span className="product-price">{formatPrice(p.price)}</span>
                  </div>
                </MediaWrap>

                {/* 찜 */}
                <button
                  className="icon-btn like"
                  type="button"
                  aria-pressed={isFav ? "true" : "false"}
                  aria-label={isFav ? "즐겨찾기 제거" : "즐겨찾기 추가"}
                  title={isFav ? "즐겨찾기 제거" : "즐겨찾기 추가"}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    toggleFav(p);
                    setToast(isFav ? "즐겨찾기를 해제했어요" : "즐겨찾기에 추가했어요");
                  }}
                >
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path
                      d="M12.1 21s-6.4-4.2-9-6.8A5.8 5.8 0 0 1 12 6a5.8 5.8 0 0 1 8.9 8.3c-2.6 2.7-8.8 6.7-8.8 6.7z"
                      fill={isFav ? "currentColor" : "none"}
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>

                {/* 장바구니: 품절만 막고, 상세 없음이어도 담기는 유지(원하면 유지) */}
                <button
                  className={`icon-btn cart ${isSoldOut ? "is-disabled" : ""}`}
                  type="button"
                  aria-label="장바구니 담기"
                  aria-disabled={isSoldOut ? "true" : "false"}
                  title={isSoldOut ? "품절된 상품입니다" : "장바구니 담기"}
                  disabled={isSoldOut}
                  onClick={!isSoldOut ? handleAdd(p) : undefined}
                >
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path
                      d="M6 8h12l-1.2 12H7.2L6 8z"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                    />
                    <path
                      d="M9 8V6a3 3 0 0 1 6 0v2"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                    />
                  </svg>
                </button>
              </li>
            );
          })}
        </ul>


        <div className="more">
          {showing < items.length && (
            <button
              className="btn-more"
              type="button"
              onClick={() => setShowing((s) => Math.min(s + STEP, items.length))}
            >
              more <IoIosArrowDown className="IoIosArrowDown" />
            </button>
          )}
        </div>
      </div>

      {/* ✅ 장바구니 모달 */}
      {showModal && (
        <div
          className="cart-modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="cart-modal-title"
          onClick={() => setShowModal(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,.45)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
          }}
        >
          <div
            className="cart-modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "#fff",
              borderRadius: 12,
              padding: "20px 22px",
              minWidth: 280,
              maxWidth: "85vw",
              boxShadow: "0 10px 30px rgba(0,0,0,.25)",
              textAlign: "center",
            }}
          >
            <p id="cart-modal-title" style={{ fontWeight: 700, marginBottom: 12 }}>
              장바구니에 담았어요!
            </p>
            <div className="actions" style={{ display: "flex", gap: 10, justifyContent: "center" }}>
              <button
                className="btn-primary"
                onClick={() => {
                  setShowModal(false);
                  navigate("/cart");
                }}
                style={{
                  background: "#5e472f",
                  color: "#fff",
                  border: 0,
                  padding: "10px 14px",
                  borderRadius: 8,
                  cursor: "pointer",
                  fontWeight: 700,
                }}
              >
                장바구니로 이동
              </button>
              <button
                className="btn-ghost"
                onClick={() => setShowModal(false)}
                style={{
                  background: "transparent",
                  color: "#5e472f",
                  border: "1px solid #5e472f",
                  padding: "10px 14px",
                  borderRadius: 8,
                  cursor: "pointer",
                  fontWeight: 700,
                }}
              >
                쇼핑 계속하기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ✅ 토스트(즐겨찾기) */}
      <div
        aria-live="polite"
        style={{
          position: "fixed",
          left: "50%",
          bottom: "50%",
          transform: `translate(-50%, ${toast ? "-50%" : "calc(-50% + 6px)"})`,
          background: "#5e472f",
          color: "#fff",
          padding: "10px 14px",
          borderRadius: 8,
          boxShadow: "0 6px 16px rgba(0,0,0,.2)",
          opacity: toast ? 1 : 0,
          transition: "opacity .2s ease, transform .2s ease",
          pointerEvents: "none",
          zIndex: 9998,
        }}
      >
        {toast}
      </div>
    </section>
  );
}
