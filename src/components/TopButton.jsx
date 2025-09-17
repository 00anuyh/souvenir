import { useEffect, useState, useCallback } from "react";
import "../css/TopButton.css";

export default function TopButton({
  showAfter = 200,        // 몇 px 스크롤 후 노출할지
  offsetVar = "--fab-push-up", // 푸터 겹침 보정용 CSS 변수(없어도 OK)
  label = "TOP",
}) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > showAfter);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [showAfter]);

  const handleClick = useCallback(() => {
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced) {
      window.scrollTo(0, 0);
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, []);

  // 푸터 푸시업 변수 사용(선택 사항): 없으면 0px로 처리
  const pushUp = getComputedStyle(document.documentElement)
    .getPropertyValue(offsetVar) || "0px";

  return (
    <button
      type="button"
      className={`top-btn ${visible ? "is-show" : ""}`}
      onClick={handleClick}
      aria-label="맨 위로 이동"
    >
      <span className="top-btn__arrow" aria-hidden>↑</span>
      <span className="top-btn__label">{label}</span>
    </button>
  );
}
