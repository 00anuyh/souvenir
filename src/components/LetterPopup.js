// src/components/LetterPopup.jsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { IoClose } from "react-icons/io5";
import "../css/LetterPopup.css";

export default function LetterPopup({
  goTo = "/event",
  storageKey = "souvenir_lucky_popup_seen_v2", // 새 키 권장
  ttlHours = 24,                                // "편지 받으러 가기" 누른 뒤 숨김 시간
  alwaysShow = false,                           // true면 무조건 표시(테스트용)
}) {
  const navigate = useNavigate();

  const now = () => Date.now();
  const ttlMs = useMemo(
    () => Math.max(1, Number(ttlHours)) * 60 * 60 * 1000,
    [ttlHours]
  );

  // 저장된 숫자(raw) 읽기: 미래값이면 "until", 과거값이면 "본 시각(ts)"
  const readRaw = () => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (!raw) return null;
      const n = Number(raw);
      return Number.isFinite(n) ? n : null;
    } catch {
      return null;
    }
  };

  // 지금 숨겨야 하는 상태인지
  const isHiddenNow = () => {
    if (alwaysShow) return false;
    const n = readRaw();
    if (!n) return false;
    const t = now();
    if (n > t) return true;         // 오늘 자정까지 같은 future until
    return t - n < ttlMs;           // 과거 ts + ttl내 → 숨김
  };

  // ✅ 초기부터 localStorage 기반으로 열림 여부 결정(깜빡임/새로고침 이슈 방지)
  const [open, setOpen] = useState(() => (alwaysShow ? true : !isHiddenNow()));

  // 기록: "본 시각" (ttlHours 동안 숨김)
  const markSeenForHours = () => {
    if (alwaysShow) return;
    try { localStorage.setItem(storageKey, String(now())); } catch {}
  };

  // 기록: 오늘 자정까지 숨김 (future until 저장)
  const hideForToday = () => {
    if (alwaysShow) return setOpen(false);
    const end = new Date();
    end.setHours(23, 59, 59, 999);
    try { localStorage.setItem(storageKey, String(end.getTime())); } catch {}
    setOpen(false);
  };

  // 단순 닫기(기록 없음)
  const dismiss = () => setOpen(false);

  // 이동 버튼: ttlHours 숨김 + 이동
  const goEvent = () => {
    markSeenForHours();
    navigate(goTo);
  };

  // ESC 닫기 & 다른 탭 변경 동기화
  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") dismiss(); };
    const onStorage = (e) => { if (e.key === storageKey) setOpen(!(alwaysShow ? false : isHiddenNow())); };
    window.addEventListener("keydown", onKey);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("storage", onStorage);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey, ttlMs, alwaysShow]);

  if (!open) return null;

  return (
    <div
      className="LetterPopup-overlay"
      onClick={dismiss}                 // 배경 클릭: 기록 없이 닫기
      role="presentation"
    >
      <div
        className="LetterPopup-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="lp-title"
      >
        {/* X 닫기(기록 없음) */}
        <button className="LetterPopup-close" onClick={dismiss} aria-label="닫기">
          <IoClose />
        </button>

        <h2 id="lp-title" className="LetterPopup-title">행운의 편지 받기</h2>
        <p className="LetterPopup-subtitle">오늘의 작은 설렘을 전해 드려요.</p>

        {/* 우체통/편지 이미지: 클릭 시 ttlHours 숨김 */}
        <Link to="/event" className="LetterPopup-hero" onClick={markSeenForHours}>
          <div className="LetterPopup-heroImg"></div>
        </Link>

        <div className="LetterPopup-btnRow">
          {/* ✅ 오늘 하루 그만보기: 자정까지 숨김 */}
          <button className="LetterPopup-btn LetterPopup-btnClose" onClick={hideForToday}>
            오늘 하루 그만보기
          </button>

          {/* 이동 + ttlHours 숨김 */}
          <button className="LetterPopup-btn LetterPopup-btnPrimary" onClick={goEvent}>
            편지 받으러 가기
          </button>
        </div>
      </div>
    </div>
  );
}
