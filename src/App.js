import "./App.css";
import { Routes, Route, Outlet, useLocation } from "react-router-dom";
import { useEffect, useRef, useState, useCallback } from "react";

import ScrollToTop from "./components/ScrollToTop";
import PageFade from "./components/PageFade";

import Header from "./components/Header";
import Footer from "./components/Footer";
import Chatbot from "./components/Chatbot";
import AdminSetup from "./routes/AdminSetup";
import LetterPopup from "./components/LetterPopup";

import MainPage from "./routes/MainPage";
import LifeStyle from "./routes/LifeStyle";
import Lighting from "./routes/Lighting";
import Objects from "./routes/Objects";
import Community from "./routes/Community";
import Community2 from "./routes/Community2";
import Community3 from "./routes/Community3";
import Detail from "./routes/Detail";
import Cart from "./routes/Cart";
import Payment from "./routes/Payment";
import Payment2 from "./routes/Payment2";
import Login from "./routes/Login";
import MyPage from "./routes/MyPage";
import Event from "./routes/Event";
import Favorites from "./routes/Favorites";
import Best from "./routes/Best";

/* =========================
   ✅ 탭 최초 1회만 뜨는 풀스크린 스플래시 (오버레이)
   ========================= */
function SplashOverlay({
  text = "Souvenir",
  stext = "추억을 선물하는 소품샵",
  videoSrc = "https://00anuyh.github.io/SouvenirImg/intro.mp4",
  poster = "",
  duration = 2500,
  fadeMs = 600,
  onDone,
}) {
  const [fade, setFade] = useState(false);
  const [gone, setGone] = useState(false);
  const closedRef = useRef(false);
  const killerRef = useRef(null);

  const safeClose = useCallback(() => {
    if (closedRef.current || gone) return;
    closedRef.current = true;
    setFade(true);
    killerRef.current = setTimeout(() => {
      if (!gone) onDone?.();
      setGone(true);
    }, fadeMs + 50);
  }, [gone, fadeMs, onDone]);

  useEffect(() => {
    const t = setTimeout(safeClose, duration);
    return () => {
      clearTimeout(t);
      if (killerRef.current) clearTimeout(killerRef.current);
    };
  }, [duration, safeClose]);

  useEffect(() => {
    const handler = () => safeClose();
    const keyHandler = (e) => {
      const k = e.key;
      if (k === "Escape" || k === "Enter" || k === " ") {
        e.preventDefault();
        safeClose();
      }
    };
    document.addEventListener("pointerdown", handler, { passive: true });
    document.addEventListener("click", handler, { passive: true });
    document.addEventListener("touchstart", handler, { passive: true });
    document.addEventListener("keydown", keyHandler);
    return () => {
      document.removeEventListener("pointerdown", handler);
      document.removeEventListener("click", handler);
      document.removeEventListener("touchstart", handler);
      document.removeEventListener("keydown", keyHandler);
    };
  }, [safeClose]);

  if (gone) return null;

  const wrapStyle = {
    position: "fixed",
    inset: 0,
    zIndex: 99999,
    background: "#000",
    display: "grid",
    placeItems: "center",
    overflow: "hidden",
    opacity: fade ? 0 : 1,
    visibility: fade ? "hidden" : "visible",
    transition: `opacity ${fadeMs}ms ease, visibility 0s linear ${fadeMs}ms`,
    cursor: "pointer",
  };
  const videoStyle = {
    position: "absolute",
    inset: 0,
    width: "100%",
    height: "100%",
    objectFit: "cover",
    opacity: 0.75,
    pointerEvents: "none",
    background: "#000",
  };
  const textWrap = {
    position: "relative",
    zIndex: 1,
    display: "grid",
    placeItems: "center",
    padding: "0 20px",
    textAlign: "center",
  };
  const textStyle = {
    fontSize: "4rem",
    color: "#fff",
    lineHeight: 1.2,
    letterSpacing: "0.02em",
    fontFamily: "Playfair Display",
    textShadow: "2px 3px 2px #888",
  };
  const stextStyle = {
    fontSize: "1.1rem",
    color: "#fff",
    lineHeight: 1.5,
    letterSpacing: "2px",
    fontFamily: "NanumSquareRound",
    textShadow: "1px 2px 1px #888",
    fontWeight: "400",
  };

  return (
    <div
      style={wrapStyle}
      onClickCapture={safeClose}
      onPointerDownCapture={safeClose}
      onTransitionEnd={(e) => {
        if (e.propertyName === "opacity" && fade && !gone) {
          onDone?.();
          setGone(true);
        }
      }}
      aria-hidden={fade}
      role="button"
      tabIndex={0}
      aria-label="인트로 닫기"
    >
      <video
        style={videoStyle}
        autoPlay
        muted
        playsInline
        preload="auto"
        loop
        {...(poster ? { poster } : {})}
        onClick={safeClose}
        onPointerDown={safeClose}
        aria-hidden="true"
      >
        <source src={videoSrc} type="video/mp4" />
      </video>
      <div style={textWrap}>
        <p style={textStyle}>{text}</p>
        <p style={stextStyle}>{stext}</p>
      </div>
    </div>
  );
}

/* =========================
   레이아웃 래퍼들
   ========================= */
function WithHeaderFade() {
  return (
    <>
      <Header />
      <PageFade>
        <Outlet />
      </PageFade>
    </>
  );
}
function WithoutHeader() {
  return <Outlet />;
}

export default function App() {
  const [showChatbot, setShowChatbot] = useState(false);

  // ✅ 인트로 = 스플래시. 이 탭에서 최초 1회만 표시
  const SS_KEY = "souvenir_splash_seen_session_v1";
  const [showSplash, setShowSplash] = useState(() => {
    try { return !sessionStorage.getItem(SS_KEY); } catch { return true; }
  });

  const { pathname } = useLocation();
  const showPopup = pathname === "/"; // 메인에서만 레터팝업

  // 푸터 겹침 보정
  useEffect(() => {
    const footer =
      document.querySelector("footer") || document.getElementById("app-footer");
    if (!footer) return;

    const updatePushUp = () => {
      const rect = footer.getBoundingClientRect();
      const vh = window.innerHeight || 0;
      const overlap = Math.max(0, vh - Math.max(rect.top, 0));
      const push = overlap > 0 ? `${overlap}px` : "0px";
      document.documentElement.style.setProperty("--fab-push-up", push);
    };

    updatePushUp();
    const onScrollResize = () => updatePushUp();
    window.addEventListener("scroll", onScrollResize, { passive: true });
    window.addEventListener("resize", onScrollResize);

    const io = new IntersectionObserver(() => updatePushUp(), {
      root: null,
      threshold: [0, 0.01, 0.1, 0.5, 1],
    });
    io.observe(footer);

    return () => {
      window.removeEventListener("scroll", onScrollResize);
      window.removeEventListener("resize", onScrollResize);
      io.disconnect();
    };
  }, []);

  return (
    <>
      {/* ✅ 스플래시: 인트로 자체. 탭 최초 1회만 */}
      {showSplash && (
        <SplashOverlay
          text="Souvenir"
          stext="추억을 선물하는 소품샵"
          videoSrc="https://00anuyh.github.io/SouvenirImg/intro.mp4"
          poster="/images/intro-poster.jpg"
          duration={2500}
          onDone={() => {
            try { sessionStorage.setItem(SS_KEY, "1"); } catch {}
            setShowSplash(false);
          }}
        />
      )}

      {/* 스플래시가 끝난 뒤에만 실제 앱 렌더 */}
      {!showSplash && (
        <>
          <ScrollToTop />

          <div className="Warp">
            <Routes>
              {/* ⬇️ 루트는 바로 메인 페이지 (Intro 라우트 없음) */}
              <Route element={<WithHeaderFade />}>
                <Route index element={<MainPage />} />
                <Route path="lifestyle" element={<LifeStyle />} />
                <Route path="lighting" element={<Lighting />} />
                <Route path="objects" element={<Objects />} />
                <Route path="community" element={<Community />} />
                <Route path="community2" element={<Community2 />} />
                <Route path="community3/:id" element={<Community3 />} />
                <Route path="cart" element={<Cart />} />
                <Route path="payment" element={<Payment />} />
                <Route path="payment2" element={<Payment2 />} />
                <Route path="event" element={<Event />} />
                <Route path="mypage" element={<MyPage />} />
                <Route path="login" element={<Login />} />
                <Route path="favorites" element={<Favorites />} />
                <Route path="best" element={<Best />} />
                <Route path="/admin-setup" element={<AdminSetup />} />
              </Route>

              {/* 헤더 없음(페이드 X): Detail 보호 */}
              <Route element={<WithoutHeader />}>
                <Route path="detail/:slug" element={<Detail />} />
                <Route path="detail" element={<Detail />} />
              </Route>

              <Route
                path="*"
                element={<div style={{ padding: 40 }}>페이지를 찾을 수 없어요.</div>}
              />
            </Routes>

            {/* 플로팅 챗봇 버튼 */}
            {!showChatbot && (
              <button
                type="button"
                className="floating-ask"
                onClick={() => setShowChatbot(true)}
                aria-label="도움이 필요하신가요?"
              >
                <img
                  src="https://00anuyh.github.io/SouvenirImg/askicon.png"
                  width="60"
                  alt="help"
                />
              </button>
            )}
            {showChatbot && <Chatbot onClose={() => setShowChatbot(false)} />}
          </div>

          {/* ✅ 레터 팝업: 메인에서만, 스플래시 중엔 숨김 */}
          {showPopup && (
            <LetterPopup
              goTo="/event"
              ttlHours={24}
              storageKey="souvenir_lucky_popup_seen_v2"
            />
          )}

          <Footer />
        </>
      )}
    </>
  );
}
