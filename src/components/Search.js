import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../css/search.css";

const products = [
  { id: 1, name: "MINA M 조명", slug: "lamp-amber-001" },
  { id: 2, name: "우드트레이 향수 트레이", slug: "ovject-item-001" },
  { id: 3, name: "아토 테이블 조명 ", slug: "lamp-amber-002" },
  { id: 4, name: "사과 오브제 인센스홀더", slug: "ovject-item-002" },
  { id: 4, name: "닐로 머그컵", slug: "nillo-mug-001" },
];

export default function Search({ open, onClose }) {
  const navigate = useNavigate();
  const modalRef = useRef(null);

  const [keyword, setKeyword] = useState("");
  const [results, setResults] = useState(products);

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose?.();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const goDetail = (item) => {
    if (!item?.slug) return;
    navigate(`/detail/${item.slug}`); // 여기! 소문자 detail + 슬러그 사용
    onClose?.();
  };
  const handleSubmit = (e) => {
    e.preventDefault();
    const kw = keyword.trim().toLowerCase();
    if (!kw) return;
    const filtered = products.filter((p) =>
      p.name.toLowerCase().includes(kw)
    );
    setResults(filtered);
    if (filtered.length === 1) goDetail(filtered[0]);
  };

  const handleChipClick = (name) => {
    const found = products.find((p) => p.name === name);
    if (found) goDetail(found);
  };

  return (
    <>
      {/* 백드롭: 헤더 포함 전체 덮기 */}
      <div
        className={`search-backdrop ${open ? "is-open" : ""}`}
        onClick={onClose}
        aria-hidden={!open}
      />

      {/* 풀폭 드롭 패널 */}
      <section
        ref={modalRef}
        className={`search-drop-panel ${open ? "is-open" : ""}`}
        role="dialog"
        aria-label="사이트 검색"
        aria-hidden={!open}
      >
        <div className="search-top">
          <img src="https://00anuyh.github.io/SouvenirImg/logo.png" alt="Souvenir" className="search-logo" />
          <button className="close-btn" onClick={onClose} aria-label="닫기">✕</button>
        </div>

        <form
          className="search-bar"
          onSubmit={handleSubmit}
        >
          <input name="q" type="text" placeholder="추천검색어를 입력하세요" value={keyword}
            onChange={(e) => setKeyword(e.target.value)} />
          <button type="submit" className="search-btn" aria-label="검색">
            <i className="fa-solid fa-magnifying-glass" />
          </button>
        </form>

        <div className="chip-row">
          {products.map((p) => (
            <button
              key={p.id}
              type="button"
              className="chip"
              onClick={() => handleChipClick(p.name)}>
              #{p.name}
            </button>
          ))}
        </div>

        {/* {results?.length > 1 && (
          <ul className="result-list">
            {results.map((item) => (
              <li key={item.id}>
                <button type="button" onClick={() => goDetail(item)}>{item.name}</button>
              </li>
            ))}
          </ul>
        )} */}
        {results?.length === 0 && <p className="no-result">검색 결과가 없습니다.</p>}
      </section>
    </>
  );
}
