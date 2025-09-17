import { useEffect, useState, useCallback } from "react";
import "../css/TopButton.css";

export default function TopButton({
  showAfter = 200,
  label = "TOP",
}) {
  const [visible, setVisible] = useState(false);
  const [pushUp, setPushUp] = useState("0px"); // footer 겹침 보정값(px)

  // 스크롤 양에 따라 표시/숨김
  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > showAfter);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [showAfter]);

  // footer 겹침 높이 계산: ResizeObserver + rAF
  useEffect(() => {
    const footer = document.querySelector("footer");
    if (!footer) return;

    const recalcFooterOverlap = () => {
      const rect = footer.getBoundingClientRect();
      const vh = window.innerHeight || 0;
      // 화면 하단과 footer가 겹치는 높이 (음수 방지)
      const overlap = Math.max(0, vh - Math.max(rect.top, 0));
      setPushUp(overlap > 0 ? `${overlap}px` : "0px");
    };

    let ro;
    const onScrollResize = () => {
      // 루프/레이아웃 스래싱 방지: 다음 프레임에 계산
      requestAnimationFrame(recalcFooterOverlap);
    };

    // 1) footer 사이즈/레이아웃 변화 감지
    if ("ResizeObserver" in window) {
      ro = new ResizeObserver(() => {
        requestAnimationFrame(recalcFooterOverlap);
      });
      ro.observe(footer);
    }

    // 2) 스크롤/리사이즈 시에도 재계산
    window.addEventListener("scroll", onScrollResize, { passive: true });
    window.addEventListener("resize", onScrollResize);

    // 3) 초기 1회 계산
    recalcFooterOverlap();

    return () => {
      window.removeEventListener("scroll", onScrollResize);
      window.removeEventListener("resize", onScrollResize);
      if (ro) ro.disconnect();
    };
  }, []);

  const handleClick = useCallback(() => {
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced) {
      window.scrollTo(0, 0);
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, []);

  return (
    <button
      type="button"
      className={`top-btn ${visible ? "is-show" : ""}`}
      onClick={handleClick}
      aria-label="맨 위로 이동"
      style={{ bottom: `calc(24px + ${pushUp})` }}  // 👈 footer 겹침과 동일하게 보정
    >
      <span className="top-btn__arrow" aria-hidden>↑</span>
      <span className="top-btn__label">{label}</span>
    </button>
  );
}
