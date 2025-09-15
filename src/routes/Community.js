// src/routes/Community.jsx
import React, {
  useEffect,
  useMemo,
  useState,
  useCallback,
  useRef,
} from "react";
import { useNavigate } from "react-router-dom";
import {
  IoHeartOutline,
  IoPricetagOutline,
  IoChatbubbleEllipsesOutline,
} from "react-icons/io5";
import "../css/Community.css";

import NewsCard from "../components/NewsCard";
import postsData from "../data/CommunityData.json";
import { useAuth } from "../context/AuthContext";

/* ================== 상수(컴포넌트 바깥) ================== */
const STORAGE_KEY = "communityPosts";          // 사용자가 작성한 글 저장
const LIKES_KEY   = "communityLikes";          // id별 좋아요 저장(옵션)
const HIDE_KEY    = "communityAdminHidden";    // 관리자 숨김 목록

const NEWS_CACHE_KEY = "newsSlidesCache_v1";   // 뉴스 캐시 키
const NEWS_CACHE_TTL = 60 * 60 * 1000;         // 1시간(ms)

// GH Pages(프로젝트 페이지) 경로 안전: /souvenir 하위에서도 동작
const PUB = process.env.PUBLIC_URL || "";

/* ================== 저장소 유틸 ================== */
const loadSavedPosts = () => {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; }
  catch { return []; }
};
const loadLikesMap = () => {
  try { return JSON.parse(localStorage.getItem(LIKES_KEY)) || {}; }
  catch { return {}; }
};
const saveLikesMap = (map) => {
  localStorage.setItem(LIKES_KEY, JSON.stringify(map));
};
const loadHiddenKeys = () => {
  try { return JSON.parse(localStorage.getItem(HIDE_KEY)) || []; }
  catch { return []; }
};
const saveHiddenKeys = (arr) => {
  localStorage.setItem(HIDE_KEY, JSON.stringify(arr));
  // 다른 탭 동기화
  window.dispatchEvent(
    new StorageEvent("storage", { key: HIDE_KEY, newValue: JSON.stringify(arr) })
  );
};

// 시드 글 숨김 식별용 간단 해시
const hashStr = (s = "") => {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h) + s.charCodeAt(i);
  return String(h >>> 0);
};
const makeKey = (p) =>
  p?.id != null
    ? `id:${p.id}`
    : `hx:${hashStr(JSON.stringify({
        author: p.author || p.user || "",
        text: p.content || p.text || "",
        img: p.image || (p.photos?.[0] ?? ""),
      }))}`;

/* ================== 카드 ================== */
function ComCard({ post, onLike, isAdmin, isMine, onAdminDelete }) {
  const navigate = useNavigate();

  const goDetail = () => {
    if (post.id != null) navigate(`/Community3/${post.id}`);
  };

  // 기본 이미지 경로는 PUBLIC_URL 기반(프로젝트 페이지 대응)
  const fallback = `${PUB}/img/default-image.png`;
  let mainImg = fallback;

  if (post.image) {
    mainImg = post.image;
  } else if (post.photos && post.photos.length > 0) {
    const firstPhoto = post.photos[0];
    mainImg = typeof firstPhoto === "string" ? firstPhoto : URL.createObjectURL(firstPhoto);
  }
  
  const avatarUrl = post.userImg || "";

  return (
    <div className="comBox">
      <div className="comImg" onClick={goDetail}>
        <img
          src={mainImg}
          alt="커뮤이미지"
          onError={(e) => { e.currentTarget.src = fallback; }}
        />
      </div>

      <div className="comInpo">
        <div className="comUser">
          <div
            className={`a_profile-img ${avatarUrl ? "has-img" : "is-empty"}`}
            style={avatarUrl ? { backgroundImage: `url(${avatarUrl})` } : undefined}
            aria-hidden="true"
            title="프로필 사진은 마이페이지에서 변경할 수 있어요."
          >
            {!avatarUrl && <i className="fa-solid fa-user" aria-hidden="true"></i>}
          </div>
          <p>{post.author || post.user || "익명"}</p>
        </div>

        <div className="comText" onClick={goDetail}>
          {post.content || post.text || ""}
        </div>

        <div className="like-tag-mes">
          {(post._src === "local") && (isMine || isAdmin) && (
            <button
              type="button"
              className="comDelBtn"
              title="내 글 삭제"
              onClick={() => onAdminDelete?.(post)}
            >
              삭제
            </button>
          )}

          <div role="button" tabIndex={0} onClick={() => onLike?.(post)}>
            <IoHeartOutline className="ltm-icon" aria-hidden="true" />
            <span className="ltm-num">{Number(post.likes || 0)}</span>
          </div>
          <div role="button" tabIndex={0}>
            <IoPricetagOutline className="ltm-icon" aria-hidden="true" />
            <span className="ltm-num">{Number(post.tagsCount || 0)}</span>
          </div>
          <div role="button" tabIndex={0}>
            <IoChatbubbleEllipsesOutline className="ltm-icon" aria-hidden="true" />
            <span className="ltm-num">{Number(post.commentsCount || 0)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ================== 페이지 ================== */
export default function Community() {
  const navigate = useNavigate();
  const { isLoggedIn, user, isAdmin: isAdminFn } = useAuth();

  const writeNavigate = () => {
    if (!isLoggedIn?.local) {
      const goLogin = window.confirm("로그인이 필요합니다. 로그인 페이지로 이동하시겠습니까?");
      if (goLogin) navigate("/Login");
      return;
    }
    navigate("/Community2");
  };

  /* 관리자 여부 */
  const isAdmin = useMemo(() => {
    try {
      if (typeof isAdminFn === "function") return !!isAdminFn();
    } catch {}
    return !!(
      user?.role === "admin" ||
      user?.isAdmin === true ||
      isLoggedIn?.role === "admin" ||
      isLoggedIn?.admin === true
    );
  }, [isAdminFn, user, isLoggedIn]);

  /* ===== 커뮤니티 글: 로컬 + JSON 통합 ===== */
  const [posts, setPosts] = useState(() => {
    const saved = loadSavedPosts().map(p => ({ ...p, _src: "local" }));
    const base  = (Array.isArray(postsData) ? postsData : []).map(p => ({ ...p, _src: "seed" }));
    const lm = loadLikesMap();
    const merged = [...saved, ...base].map(p =>
      p?.id != null && lm[p.id] != null ? { ...p, likes: lm[p.id] } : p
    );
    const hidden = new Set(loadHiddenKeys());
    return merged.filter(p => !hidden.has(makeKey(p)));
  });

  // 여러 탭/페이지에서 저장소 변경시 동기화
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === STORAGE_KEY || e.key === LIKES_KEY || e.key === HIDE_KEY) {
        const saved = loadSavedPosts().map(p => ({ ...p, _src: "local" }));
        const base  = (Array.isArray(postsData) ? postsData : []).map(p => ({ ...p, _src: "seed" }));
        const lm = loadLikesMap();
        const merged = [...saved, ...base].map((p) =>
          p?.id != null && lm[p.id] != null ? { ...p, likes: lm[p.id] } : p
        );
        const hidden = new Set(loadHiddenKeys());
        setPosts(merged.filter(p => !hidden.has(makeKey(p))));
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  // 좋아요 증가
  const handleLike = useCallback((target) => {
    setPosts((prev) => {
      const next = prev.map((p) => {
        const isTarget = (target.id != null && p.id === target.id) || p === target;
        return isTarget ? { ...p, likes: Number(p.likes || 0) + 1 } : p;
      });
      // id가 있는 포스트는 로컬 likesMap에도 반영
      if (target.id != null) {
        const m = loadLikesMap();
        const updated = { ...m, [target.id]: Number((m[target.id] ?? target.likes ?? 0)) + 1 };
        saveLikesMap(updated);
      }
      return next;
    });
  }, []);

  // 관리자/작성자 삭제
  const handleAdminDelete = useCallback((target) => {
    if (!window.confirm("이 게시글을 삭제/숨김 처리할까요?")) return;

    if (target._src === "local") {
      const saved = loadSavedPosts();
      const newSaved = saved.filter(p => {
        if (target.id != null) return p.id !== target.id;
        try { return JSON.stringify(p) !== JSON.stringify(target); }
        catch { return true; }
      });
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newSaved));
      window.dispatchEvent(new StorageEvent("storage", { key: STORAGE_KEY, newValue: JSON.stringify(newSaved) }));

      const base = (Array.isArray(postsData) ? postsData : []).map(p => ({ ...p, _src: "seed" }));
      const lm = loadLikesMap();
      const merged = [...newSaved.map(p => ({ ...p, _src: "local" })), ...base].map(p =>
        p?.id != null && lm[p.id] != null ? { ...p, likes: lm[p.id] } : p
      );
      const hidden = new Set(loadHiddenKeys());
      const next = merged.filter(p => !hidden.has(makeKey(p)));
      setPosts(next);
      const nextTotalPages = Math.max(1, Math.ceil(next.length / PAGE_SIZE));
      setCurrentPage(prev => Math.min(prev, nextTotalPages));
      return;
    }

    // 시드 글은 숨김만
    const key = makeKey(target);
    const list = loadHiddenKeys();
    if (!list.includes(key)) {
      list.push(key);
      saveHiddenKeys(list);
    }
    setPosts(prev => prev.filter(p => makeKey(p) !== key));
    const nextTotalPages = Math.max(1, Math.ceil(Math.max(0, posts.length - 1) / PAGE_SIZE));
    setCurrentPage(prev => Math.min(prev, nextTotalPages));
  }, [posts]);

  // 내가 쓴 글 판별
  const isSame = (a, b) =>
    a && b && String(a).trim().toLowerCase() === String(b).trim().toLowerCase();

  const isPostMine = useCallback((post) => {
    if (post?._src !== "local") return false;
    const u = user || {};
    return (
      isSame(post.author, u.nickname) ||
      isSame(post.user, u.name) ||
      isSame(post.loginId, u.loginId) ||
      post.userId === u.uid ||
      post.ownerId === u.uid
    );
  }, [user]);

  // 페이지네이션
  const PAGE_SIZE = 5;
  const [currentPage, setCurrentPage] = useState(1);
  const totalPosts = posts.length;
  const totalPages = Math.ceil(totalPosts / PAGE_SIZE);

  const pagePosts = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return posts.slice(start, start + PAGE_SIZE);
  }, [posts, currentPage]);

  const goPage = (p) => {
    if (p < 1 || p > Math.max(1, totalPages)) return;
    setCurrentPage(p);
  };

  /* ===== 뉴스 배너 (프록시 사용 + 캐시) ===== */
  const [slides, setSlides] = useState([]);
  const [slideIdx, setSlideIdx] = useState(0);
  const [newsLoading, setNewsLoading] = useState(true);
  const [newsError, setNewsError] = useState("");

  // CRA 방식 환경변수 사용
  const RAW_NEWS_PROXY = process.env.REACT_APP_NEWS_PROXY || "";
  const NEWS_PROXY = RAW_NEWS_PROXY.trim();
  const fetchedRef = useRef(false);
  console.log("[News] NEWS_PROXY =", NEWS_PROXY);

  useEffect(() => {
    if (!NEWS_PROXY) {
      setNewsLoading(false);
      setNewsError("뉴스 프록시 주소가 설정되지 않았습니다. .env의 REACT_APP_NEWS_PROXY를 확인하세요.");
      return;
    }
    if (fetchedRef.current) return; // 중복 방지
    fetchedRef.current = true;

    // 1) 캐시 확인
    try {
      const raw = localStorage.getItem(NEWS_CACHE_KEY);
      if (raw) {
        const { at, slides: cached } = JSON.parse(raw);
        if (Date.now() - at < NEWS_CACHE_TTL && Array.isArray(cached) && cached.length) {
          setSlides(cached);
          setNewsLoading(false);
          return;
        }
      }
    } catch {}

    const KEYWORDS = [
      "interior design","home decor","interior trends","modern interior","minimalist home",
      "small objects","home accessories","ceramic vase","scented candle","table lamp",
      "artisan craft","decorative objects","Retro Mood","Colorful Interior","Various Materials","Natural Elements","Personalized Styling","Statement Objects"
    ];

    const buildSingleQuery = (keywords, maxLen = 480) => {
      let cur = "";
      for (const kw of keywords) {
        const next = cur ? `${cur} OR ${kw}` : kw;
        if (next.length > maxLen) break;
        cur = next;
      }
      return cur || "interior design";
    };

    const toSlides = (articles = []) =>
      articles.map((a) => ({
        img: a.urlToImage || "https://via.placeholder.com/620x311?text=No+Image",
        source: a.source?.name || "뉴스",
        time: new Date(a.publishedAt || Date.now()).toLocaleString("ko-KR", {
          month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
        }),
        title: a.title || "",
        url: a.url,
        likes: Math.floor(Math.random() * 10),
        comments: Math.floor(Math.random() * 5),
      }));

    const dedupeByUrl = (arr) => {
      const seen = new Set();
      return arr.filter((a) => {
        const key = a.url || a.title;
        if (!key || seen.has(key)) return false;
        seen.add(key);
        return true;
      });
    };

    // ✅ 안전한 요청 함수
    const fetchOnce = async (
      lang,
      { fromDays = 14, pageSize = 12, searchIn = "title,description" } = {}
    ) => {
      // 절대 URL 검증(빈값/공백/상대경로 방지)
      if (!/^https?:\/\//i.test(NEWS_PROXY)) {
        throw new Error("NEWS_PROXY invalid: " + (NEWS_PROXY || "<empty>"));
      }
      const u = new URL(NEWS_PROXY);
      u.searchParams.set("q", buildSingleQuery(KEYWORDS));
      if (lang) u.searchParams.set("lang", lang);
      u.searchParams.set("fromDays", String(fromDays));
      u.searchParams.set("pageSize", String(pageSize));
      if (searchIn) u.searchParams.set("searchIn", searchIn);

      const res = await fetch(u.toString(), { cache: "no-store", mode: "cors", credentials: "omit" });
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(`HTTP ${res.status}: ${text.slice(0, 200)}`);
      }
      return res.json();
    };

    const run = async () => {
      setNewsLoading(true);
      setNewsError("");
      try {
        // 단계적 폴백: ko → en → 기간 확장 → 언어 제한 해제 → 제목 위주
        let articles = (await fetchOnce("ko")).articles || [];
        if (articles.length < 5) articles = articles.concat((await fetchOnce("en")).articles || []);
        if (articles.length < 5) articles = articles.concat((await fetchOnce("en", { fromDays: 30 })).articles || []);
        if (articles.length < 5) articles = articles.concat((await fetchOnce("", { fromDays: 30 })).articles || []);
        if (articles.length < 5) articles = articles.concat((await fetchOnce("", { fromDays: 30, searchIn: "title" })).articles || []);

        const cleaned = dedupeByUrl(articles)
          .sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt))
          .slice(0, 8);

        const slidesData = toSlides(cleaned);
        setSlides(slidesData);

        // 캐시 저장
        try {
          localStorage.setItem(
            NEWS_CACHE_KEY,
            JSON.stringify({ at: Date.now(), slides: slidesData })
          );
        } catch {}
      } catch (e) {
        console.error("[News] failed:", e);
        const msg = String(e).includes("Failed to fetch")
          ? "네트워크/CORS 문제로 요청이 차단되었습니다. Render의 CORS_ORIGIN과 로컬 환경변수를 확인하세요."
          : `뉴스 로딩 실패: ${e.message}`;
        setNewsError(msg);
        setSlides([]);
      } finally {
        setNewsLoading(false);
      }
    };
    run();
  }, [NEWS_PROXY]);

  const totalSlides = slides.length;
  const nextSlide = useCallback(() => {
    setSlideIdx((i) => (i + 1) % Math.max(1, totalSlides));
  }, [totalSlides]);
  const prevSlide = useCallback(() => {
    setSlideIdx((i) => (i - 1 + Math.max(1, totalSlides)) % Math.max(1, totalSlides));
  }, [totalSlides]);

  /* ===== 렌더 ===== */
  return (
    <div className="comwarp1">
      {/* 뉴스 배너 */}
      <div className="newsBanner">
        {newsLoading ? (
          <p>뉴스 불러오는 중...</p>
        ) : newsError ? (
          <p>{newsError}</p>
        ) : totalSlides > 0 ? (
          <NewsCard
            {...slides[slideIdx]}
            index={slideIdx}
            total={totalSlides}
            onPrev={totalSlides > 1 ? prevSlide : undefined}
            onNext={totalSlides > 1 ? nextSlide : undefined}
          />
        ) : (
          <p>표시할 인테리어 뉴스가 없습니다.</p>
        )}
      </div>

      {/* 타이틀 */}
      <div className="toptitle">
        <div className="titleleft" />
        <h2>Community</h2>
        <div className="titleright" />
      </div>

      {/* 탭/작성하기 */}
      <div className="comTap">
        <button type="button" className="combtn">내 글 찾기</button>
        <button type="button" className="combtn">나의 활동</button>
        <button type="button" className="combtn" onClick={writeNavigate}>
          작성하기
        </button>
      </div>

      {/* 리스트 + 페이지네이션 */}
      <div className="comList">
        {totalPosts === 0 ? (
          <div className="comEmpty">
            <p>아직 올라온 글이 없어요.</p>
            <button type="button" className="combtn" onClick={writeNavigate}>
              첫 글 작성하기
            </button>
          </div>
        ) : (
          <>
            {pagePosts.map((post, idx) => {
              const mine = isPostMine(post);
              return (
                <React.Fragment key={post.id ?? `p-${(currentPage - 1) * PAGE_SIZE + idx}`}>
                  <ComCard
                    post={post}
                    onLike={handleLike}
                    isAdmin={isAdmin}
                    isMine={mine}
                    onAdminDelete={handleAdminDelete}
                  />
                  {idx !== pagePosts.length - 1 && <div className="comLine" />}
                </React.Fragment>
              );
            })}
          </>
        )}

        <div className="comPageNum" role="navigation" aria-label="페이지네이션">
          <button
            type="button"
            onClick={() => goPage(currentPage - 1)}
            disabled={Math.max(1, totalPages) <= 1 || currentPage === 1}
          >
            이전
          </button>

          {Array.from({ length: Math.max(1, totalPages) }, (_, i) => i + 1).map((n) => {
            const active = n === Math.min(currentPage, Math.max(1, totalPages));
            return (
              <button
                type="button"
                key={n}
                className={active ? "active" : ""}
                onClick={() => goPage(n)}
                disabled={totalPages <= 1}
                aria-current={active ? "page" : undefined}
              >
                {n}
              </button>
            );
          })}

          <button
            type="button"
            onClick={() => goPage(currentPage + 1)}
            disabled={Math.max(1, totalPages) <= 1 || currentPage === totalPages}
          >
            다음
          </button>
        </div>
      </div>
    </div>
  );
}
