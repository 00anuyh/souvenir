// components/NewsCard.jsx
import React from "react";
import "./NewsCard.css";

export default function NewsCard({
  img,
  source = "중앙일보",
  time = "21시간",
  title = "제목",
  likes = 0,
  comments = 0,
  isSaved = false,
  /** 슬라이드 제어(옵션) */
  onPrev,
  onNext,
  /** 도트 */
  index = 1,
  total = 5,
}) {
  const dots = Array.from({ length: total }, (_, i) => i);

  return (
    <article className="news-card" style={{ ["--img"]: `url(${img})` }}>
      {/* 좌우 내비 */}
      <button className="nav prev" aria-label="이전" onClick={onPrev}>
        <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
          <path d="M15 18l-6-6 6-6" />
        </svg>
      </button>
      <button className="nav next" aria-label="다음" onClick={onNext}>
        <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
          <path d="M9 6l6 6-6 6" />
        </svg>
      </button>

      {/* 매체/시간 */}
      <div className="news-meta">
        <span className="logo" aria-hidden="true" />
        <span>https://newsapi.org/v2/everything/{source}</span>
        <span className="sep">·</span>
        <span>{time}</span>
      </div>

      {/* 제목 */}
      <h3 className="news-title">{title}</h3>

      {/* 도트 */}
      <div className="dots" aria-hidden="true">
        {dots.map((d) => (
          <span key={d} className={`dot ${d === index ? "active" : ""}`} />
        ))}
      </div>

      {/* 접근성용 */}
      <span className="sr-only">뉴스 카드</span>
    </article>
  );
}
