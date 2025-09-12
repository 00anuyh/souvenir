// src/routes/MainPage.js (또는 src/pages/MainPage.jsx 프로젝트 경로에 맞게)
import React, { memo, useRef, useEffect, useState, useMemo, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";

/* 스와이퍼 */
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination, Autoplay } from "swiper/modules";

// 필수 CSS
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";

/* 컨텍스트/컴포넌트 */
import { useAuth } from "../context/AuthContext";
import { useFavs } from "../context/FavContext";
import WeatherCard from "../components/WeatherCard";
import { addToCart, parsePriceKRW } from "../utils/cart";

/* Icons */
import { TiArrowRightThick } from "react-icons/ti";

/* CSS */
import "../css/MainPage.css";

/* 데이터 */
import products from "../data/detailData.json";
import postsData from "../data/CommunityData.json";

/* ----------------------------- 공통 데이터/옵션 ----------------------------- */

const DETAIL_SLUG = "lamp-amber-002";

const COMMUNITY_POSTS = Array.from({ length: 10 }).map((_, i) => ({
  id: i + 1,
  bgClass: `sec3bg${i + 1}`,
  href: "/community",
  tag: "진**님의 글",
  date: "2025.01.01",
  title: "독특하게 앞쪽에 절개 디자인이 들어가서 은은하게 돋보이는 것 같아요",
}));

const autoplayFast = { delay: 1500, disableOnInteraction: false };
const loopSpeed = (speed = 600) => ({ speed, loop: true });

/* ----------------------------- 내부 컴포넌트 ----------------------------- */

const Banner = memo(function Banner() {
  const imgs = ["banner1.png", "banner2.png", "banner3.png"];
  return (
    <div className="banner">
      <ul className="banul" aria-label="메인 배너">
        {imgs.map((src) => (
          <li key={src}>
            <a href="#none">
              <img loading="lazy" src={`https://00anuyh.github.io/SouvenirImg/${src}`} alt="메인 배너" />
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
});

const MyInfo = memo(function MyInfo() {
  const { isLoggedIn, user } = useAuth();
  return (
    <div className="myinpo">
      <div className="myinpotop">
        <WeatherCard lat={37.5665} lon={126.978} />
        <p>
          <span className="main_nickname">
            {isLoggedIn?.local ? `${user?.name}님 반갑습니다` : "로그인 후 이용 해 주세요."}
          </span>{" "}
        </p>
      </div>
      <div className="myinpobottom">
        <ul className="myinpoul">
          <li className="ban2slide ban2img1" />
          <li className="ban2slide ban2img2" />
          <li className="ban2slide ban2img3" />
        </ul>
      </div>
    </div>
  );
});

const EditorsPick = memo(function EditorsPick() {
  return (
    <>
      <h3>Editor's Pick !</h3>
      <div className="sec1">
        <ul className="sec1ul">
          <li className="sec1img num1">
            <a href="#none">
              <p>
                Shop Now <TiArrowRightThick />
              </p>
            </a>
          </li>
          <li className="sec1img num2">
            <a href="#none">
              <p>
                Shop Now <TiArrowRightThick />
              </p>
            </a>
          </li>
          <li className="sec1li">
            <span>편안한 순간을 밝혀주는 에디터의 픽</span>
            <p>
              은은한 조명으로 어느 공간에서도 <br />
              잘 어울리는 디자인 입니다. <br />
              단순히 공간을 밝히는 데 그치지 않고, <br />
              공간에 따스함과 편안함을 불어넣어줍니다.
            </p>
          </li>
          <li className="sec1li">
            <span>이 소품들이 전하는 감성</span>
            <p>
              공간을 밝히는 것만이 아니라, <br />
              당신의 하루 끝에 따스함을 더합니다.
              <br />
              빛이 머무는 공간을 은은하게 <br />
              채워줍니다.
            </p>
          </li>
          <li className="sec1img num3">
            <a href="#none">
              <p>
                Shop Now <TiArrowRightThick />
              </p>
            </a>
          </li>
          <li className="sec1img num4">
            <a href="#none">
              <p>
                Shop Now <TiArrowRightThick />
              </p>
            </a>
          </li>
        </ul>
        <div className="sec1ban">
          <Link to={`/detail/${DETAIL_SLUG}`} className="sec1img num5">
            <p>
              Shop Now <TiArrowRightThick />
            </p>
          </Link>
        </div>
      </div>
    </>
  );
});

/* ----------------------------- BEST GRID ----------------------------- */


const BestGrid = memo(function BestGrid({ products: raw = [] }) {
  const SHOWING = 5;
  const navigate = useNavigate();
  const { hasFav, toggleFav } = useFavs();

  const CDN = "https://00anuyh.github.io/SouvenirImg/";

  // detailData.json -> 메인 베스트 카드용 정규화
  const items = useMemo(() => {
    const list = Array.isArray(raw) ? raw : [];
    return list.map((it, idx) => {
      const slug = String(it.id ?? String(idx + 1));

      // 1순위: gallery[0] 절대 URL이면 그대로 사용
      // 2순위: gallery[0] 상대경로면 CDN 붙이기
      // 3순위: 없으면 Best_img1~5.png 순환 폴백
      const first = it.gallery?.[0];
      const img = first
        ? (/^https?:\/\//i.test(first)
            ? first
            : `${CDN}${String(first).replace(/^\.?\//, "")}`)
        : `${CDN}Best_img${(idx % 5) + 1}.png`;

      return {
        id: slug,
        slug,
        name: it.product?.name ?? "",
        price: it.product?.price ?? "", // "₩36,000" 같은 문자열 허용
        image: img,
        soldout: Boolean(it.soldout ?? it.product?.soldout),
      };
    });
  }, [raw]);

  const visible = useMemo(() => items.slice(0, SHOWING), [items]);

  const [toast, setToast] = useState("");
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 1200);
    return () => clearTimeout(t);
  }, [toast]);

  const formatPrice = (price) =>
    typeof price === "string" ? price : (Number(price) || 0).toLocaleString("ko-KR") + "원";

  // ♥ 즐겨찾기
  const onLike = useCallback(
    (p, liked) => (e) => {
      e.preventDefault();
      e.stopPropagation();
      toggleFav(p);
      setToast(liked ? "즐겨찾기를 해제했어요" : "즐겨찾기에 추가했어요");
    },
    [toggleFav]
  );

  // 🛒 장바구니
  const [showModal, setShowModal] = useState(false);
  const onAdd = useCallback(
    (p) => (e) => {
      e.preventDefault();
      e.stopPropagation();
      const basePrice = parsePriceKRW(p.price);
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
      setShowModal(true);
    },
    []
  );


  return (
    <>
      <h3>BEST</h3>

      <ul className="main-grid">
        {visible.map((p, idx) => {
          const liked = hasFav(p.id);
          const fallbackIdx = (idx % 5) + 1;
          return (
            <li className="main-card" key={p.id}>
              <Link to={`/detail/${p.slug}`} className="main-media">
                <img
                  src={p.image}
                  alt={p.name}
                  loading="lazy"
                  onError={(e) => {
                    e.currentTarget.src = `${CDN}Best_img${fallbackIdx}.png`;
                  }}
                />
                {p.soldout && <span className="badge soldout" aria-hidden="true" />}
                <div className="main-caption">
                  <span className="main-name">{p.name}</span>
                  <span className="main-price">{formatPrice(p.price)}</span>
                </div>
              </Link>

              {/* ♥ */}
              <button
                className="icon-btn like"
                type="button"
                aria-pressed={liked ? "true" : "false"}
                aria-label={liked ? "즐겨찾기 제거" : "즐겨찾기 추가"}
                title={liked ? "즐겨찾기 제거" : "즐겨찾기 추가"}
                onClick={onLike(p, liked)}
              >
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

      <div className="sec2more">
        <Link to="/best">
          {/* 실제 파일 위치에 맞게 수정: img/ 하위라면 `${CDN}img/more.png` */}
          <img src="https://00anuyh.github.io/SouvenirImg/more.png" alt="더보기" />
          <div className="sec2Arrow">
            <img src="https://00anuyh.github.io/SouvenirImg/Vector.png" alt="더보기" />
          </div>
        </Link>
      </div>

      {/* 장바구니 모달 */}
      {showModal && (
        <div
          className="cart-modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="cart-modal-title"
          onClick={() => setShowModal(false)}
        >
          <div className="cart-modal-content" onClick={(e) => e.stopPropagation()}>
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

      {/* 토스트 */}
      <div
        aria-live="polite"
        style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: `translate(-50%, ${toast ? "-50%" : "calc(-50% + 6px)"})`,
          background: "#5e472f",
          color: "#fff",
          padding: "10px 14px",
          borderRadius: 8,
          boxShadow: "0 6px 16px rgba(0,0,0,.2)",
          opacity: toast ? 1 : 0,
          transition: "opacity .2s ease, transform .2s ease",
          pointerEvents: "none",
          zIndex: 9999,
          textAlign: "center",
          minWidth: 220,
        }}
      >
        {toast}
      </div>
    </>
  );
});

/* ----------------------------- Community / EndHero ----------------------------- */

const CommunitySwiper = memo(function CommunitySwiper() {
  // Community.jsx 와 동일한 키/도구들
  const STORAGE_KEY = "communityPosts";
  const HIDE_KEY = "communityAdminHidden";

  const loadSavedPosts = () => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  };
  const loadHiddenKeys = () => {
    try { return JSON.parse(localStorage.getItem(HIDE_KEY)) || []; }
    catch { return []; }
  };
  const hashStr = (s = "") => { let h = 5381; for (let i=0;i<s.length;i++) h=((h<<5)+h)+s.charCodeAt(i); return String(h>>>0); };
  const makeKey = (p) => p?.id != null
    ? `id:${p.id}`
    : `hx:${hashStr(JSON.stringify({
        author: p.author || p.user || "",
        text: p.content || p.text || "",
        img: p.image || (p.photos?.[0] ?? ""),
      }))}`;

  // 슬라이드 소스 만들기: 로컬 + 시드 → 숨김 제외 → 최신순 → 상위 N
  const [slides, setSlides] = useState([]);

  const buildSlides = useCallback(() => {
    const saved = loadSavedPosts().map(p => ({ ...p, _src: "local" }));
    const seed  = (Array.isArray(postsData) ? postsData : []).map(p => ({ ...p, _src: "seed" }));
    const hidden = new Set(loadHiddenKeys());
    const merged = [...saved, ...seed].filter(p => !hidden.has(makeKey(p)));

    // 메인 카드에 필요한 필드만 추출
    const toImg = (post) => {
      if (post.image && typeof post.image === "string") return post.image;
      const ph = post.photos?.[0];
      return typeof ph === "string" ? ph : "/img/default-image.png";
    };

    // 최신순 정렬(가능하면 createdAt 사용, 아니면 id/date/맨뒤)
    const toTime = (p) => {
      const cand = p.createdAt || p.date || "";
      const t = Date.parse(cand);
      return Number.isFinite(t) ? t : 0;
    };

    const list = merged
      .slice()
      .sort((a, b) => toTime(b) - toTime(a))
      .map((p) => ({
        id: p.id ?? null,
        href: p.id != null ? `/Community3/${p.id}` : "/community",
        author: p.author || p.user || "익명",
        title: (p.content || p.text || "").slice(0, 50),
        img: toImg(p),
        likes: Number(p.likes || 0),
        date: p.createdAt || p.date || "",
      }));

    // 필요한 개수만 (예: 12개)
    setSlides(list.slice(0, 10));
  }, []);

  useEffect(() => {
    buildSlides();
    const onStorage = (e) => {
      if (e.key === STORAGE_KEY || e.key === HIDE_KEY) buildSlides();
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [buildSlides]);

  return (
    <>
      <h3>Community</h3>
      <div className="sec3">
        <Swiper
          className="mySwiper Community-swiper"
          modules={[Navigation, Autoplay]}
          slidesPerView={4.8}
          spaceBetween={90}
          {...loopSpeed(700)}
          autoplay={autoplayFast}
          navigation
        >
          {slides.map((post, i) => (
            <SwiperSlide key={post.id ?? `c-${i}`}>
              <div className="sec3card">
                {/* 배경 div 쓰던 자리에 실제 이미지 렌더 */}
                <div className="sec3bg">
                  <Link to={post.href} aria-label="글 보러가기">
                    <img
                      src={post.img}
                      alt={post.title || "커뮤니티 이미지"}
                      loading="lazy"
                      onError={(e) => { e.currentTarget.src = "/img/default-image.png"; }}
                      style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", borderRadius: 5 }}
                    />
                  </Link>
                </div>

                <div className="card-text">
                  <p className="sec3tag">{post.author}</p>
                  <p className="sec3date">{post.date || ""}</p>
                  <p className="sec3title">{post.title || "글 보러가기"}</p>
                </div>
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
    </>
  );
});

const EndHeroSwiper = memo(function EndHeroSwiper() {
  const slides = [
    { cls: "sec4img1", title: "Elevate Your Everyday", desc: "Where Comfort Meets Timeless Design" },
    { cls: "sec4img2", title: "Coming Soon", desc: "Wrapped in Warmth, Styled for Life" },
    { cls: "sec4img3", title: "The Art of Giving", desc: "Thoughtful Pieces for Every Home" },
  ];

  return (
    <div className="sec4 full-bleed">
      <Swiper
        className="end-swiper"
        modules={[Pagination, Autoplay]}
        autoplay={{ delay: 3500, disableOnInteraction: false }}
        loop
        speed={700}
      >
        {slides.map((s) => (
          <SwiperSlide key={s.cls}>
            <div className={s.cls}>
              <span>{s.title}</span>
              <p>{s.desc}</p>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
});

/* ----------------------------- 메인 페이지 ----------------------------- */

export default function MainPage() {
  return (
    <div className="mainwarp">
      {/* 메인배너 + 인포 */}
      <main id="mainban">
        <Banner />
        <MyInfo />
      </main>

      {/* 섹션 1 */}
      <section id="mainsec1">
        <EditorsPick />
      </section>

      {/* 섹션 2 */}
      <section id="mainsec2">
        <BestGrid products={products} />
      </section>

      {/* 섹션 3 */}
      <section id="mainsec3">
        <CommunitySwiper />
      </section>

      {/* 섹션 4 */}
      <section id="mainsec4">
        <EndHeroSwiper />
      </section>
    </div>
  );
}
