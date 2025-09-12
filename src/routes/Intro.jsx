// src/components/Splash.jsx
import { useEffect, useState } from "react";
import "../css/Intro.css";

export default function Splash({
  text = "Welcome",
  // ✅ public/videos 기본값
  videoSrc = process.env.PUBLIC_URL + "/videos/intro.mp4",
  poster = process.env.PUBLIC_URL + "/videos/intro-poster.jpg",
  onDone,
}) {
  const [fade, setFade] = useState(false);
  const [gone, setGone] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setFade(true), 2500); // 2.5초 후 페이드아웃 시작
    return () => clearTimeout(t);
  }, []);

  const handleTransitionEnd = () => {
    if (fade) {
      setGone(true);     // 화면에서 제거
      onDone?.();        // 필요하면 부모에 종료 콜백 알림
    }
  };

  if (gone) return null;

  return (
    <div
      className={`splash ${fade ? "is-hide" : ""}`}
      onTransitionEnd={handleTransitionEnd}
      aria-hidden={fade}
    >
      <video
        className="splash__video"
        autoPlay
        muted
        playsInline
        preload="auto"
        {...(poster ? { poster } : {})}
      >
        <source src={videoSrc} type="video/mp4" />
      </video>

      <div className="splash__center">
        <p className="splash__text">{text}</p>
      </div>
    </div>
  );
}
