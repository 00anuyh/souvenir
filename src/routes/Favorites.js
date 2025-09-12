import styled from "styled-components";
import "../css/favorite.css";
import React, { useEffect, useState, useCallback } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useFavs } from "../context/FavContext";
import { addToCart, parsePriceKRW } from "../utils/cart";

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

const LikeBox = styled.div``; // 필요 시 확장

const Favorites = () => {
  const { favs, toggleFav, hasFav } = useFavs();
  const location = useLocation();
  const navigate = useNavigate();

  // 라우터 state로 전달된 즐겨찾기 토글 지시 처리
  useEffect(() => {
    const toggleId = location.state?.toggle;
    if (!toggleId) return;

    // BestGrid에서 navigate("/favorites", { state: { toggle: slug } }) 로 보냄
    // toggleFav가 id를 받도록 일관화
    toggleFav(toggleId);

    // state 비워서 새로고침/뒤로가기 시 재토글 방지
    navigate(".", { replace: true, state: null });
  }, [location.state, toggleFav, navigate]);

  
 // ❤️ 즐겨찾기
   const onLike = useCallback(
     (p, liked) => (e) => {
       e.preventDefault(); e.stopPropagation();
       toggleFav(p); // 스냅샷 저장 → Favorites 이미지/가격 유지
       setToast(liked ? "즐겨찾기를 해제했어요" : "즐겨찾기에 추가했어요");
     },
     [toggleFav]
   );
 
   
  const [toast, setToast] = useState("");
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 1200);
    return () => clearTimeout(t);
  }, [toast]);
 
   const [showModal, setShowModal] = useState(false);
   // 🛒 장바구니: 공용 유틸 사용 (페이지 간 자동 병합)
   const onAdd = useCallback(
     (p) => (e) => {
       e.preventDefault(); e.stopPropagation();
       const basePrice = parsePriceKRW(p.price); // "₩36,000" → 36000
       addToCart(
         {
           id: p.id,
           slug: p.slug,
           name: p.name,
           price: basePrice,
           basePrice,
           optionId: null,
           optionLabel: "기본 구성",
           thumb: p.image,
           delivery: 0,
         },
         1
       );
       // 모달은 취향대로. 여기서는 토스트만
       setShowModal(true);
       // 다른 페이지도 즉시 갱신되도록 이벤트 이미 dispatch됨(utils/cart 내부)
     },
     []
   );
 
  return (
    <LikeBox>
      <div className="fav-wrap">
        <div className="fav-container">
          <div className="toptitle">
            <div className="titleleft" />
            <h2>Favorites</h2>
            <div className="titleright" />
          </div>

          {favs.length === 0 ? (
            <p style={{ padding: "24px 0" }}>
              즐겨찾기한 상품이 없어요. 카테고리에서 ♥ 를 눌러 추가해보세요.
            </p>
          ) : (
           <ul className="product-grid">
            {favs.map((p) => {
              const liked = hasFav(p.id);
              return (
                <li className="product-card" key={p.id}>
                  <Link to={`/detail/${p.slug}`} className="product-media">
                    <img src={p.image} alt={p.name} loading="lazy" />
                    {p.soldout && <span className="badge soldout" aria-hidden="true" />}
                    <div className="product-caption">
                      <span className="product-name">{p.name}</span>
                      <span className="product-price">{typeof p.price === "string" ? p.price : (Number(p.price)||0).toLocaleString("ko-KR")+"원"}</span>
                    </div>
                  </Link>

                  <button
                  className="icon-btn like"
                  type="button"
                  aria-pressed={liked ? "true" : "false"}
                  aria-label={liked ? "즐겨찾기 제거" : "즐겨찾기 추가"}
                  title={liked ? "즐겨찾기 제거" : "즐겨찾기 추가"}
                  onClick={onLike(p, liked)}
                >
                  {/* currentColor 상속 → CSS로 빨강 */}
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path
                      d="M12.1 21s-6.4-4.2-9-6.8A5.8 5.8 0 0 1 12 6a5.8 5.8 0 0 1 8.9 8.3c-2.6 2.7-8.8 6.7-8.8 6.7z"
                      fill={liked ? "currentColor" : "none"}
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>

                {/* 🛒 */}
                <button
                  className="icon-btn cart"
                  type="button"
                  aria-label="장바구니 담기"
                  title="장바구니 담기"
                  onClick={onAdd(p)}
                >
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M6 8h12l-1.2 12H7.2L6 8z" fill="none" stroke="currentColor" strokeWidth="1.8" />
                    <path d="M9 8V6a3 3 0 0 1 6 0v2" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                  </svg>
                </button>
              </li>
              );
            })}
          </ul>
          )}
        </div>
        {showModal && (
        <div
          className="cart-modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="cart-modal-title"
          onClick={() => setShowModal(false)} // 바깥 클릭 닫기
        >
          <div
            className="cart-modal-content"
            onClick={(e) => e.stopPropagation()} // 내부 클릭은 전파 막기
          >
            <p id="cart-modal-title">장바구니에 담았어요!</p>
            <div className="actions">
              <button
                className="btn-primary"
                onClick={() => {
                  setShowModal(false);
                  navigate("/cart");
                }}
              >
                장바구니로 이동
              </button>
              <button className="btn-ghost" onClick={() => setShowModal(false)}>
                쇼핑 계속하기
              </button>
            </div>
          </div>
        </div>
      )}
      {/* 중앙 토스트 */}
      <div
        aria-live="polite"
        style={{
          position: "fixed",
          left:"50%",
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
      </div>
    </LikeBox>
  );
};

export default Favorites;
