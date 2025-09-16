// src/pages/Event.jsx
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  addGifts,
  grantEventCoupon,
  hasValidRecentPurchase,
  consumeRecentPurchase,
} from "../utils/rewards";
import { getSession } from "../utils/localStorage";
import "../css/Event.css";

/* ====== 상수/키 ====== */
const WIN_RATE = 0.5;
const IMG = {
  CLOSED: "https://00anuyh.github.io/SouvenirImg/a_event_green.png",
  WIN: "https://00anuyh.github.io/SouvenirImg/win.png",
  LOSE: "https://00anuyh.github.io/SouvenirImg/lose.png",
};
const KEY_BASE = "souvenirEventResult";
const keyFor = (uid) => (uid ? `${KEY_BASE}:${uid}` : KEY_BASE);

const WIN_EVER_KEY_BASE = "souvenirEventEverWon";
const winEverKeyFor = (uid) =>
  (uid ? `${WIN_EVER_KEY_BASE}:${uid}` : WIN_EVER_KEY_BASE);

/* ====== 유틸 ====== */
function getUid() {
  const s = getSession?.();
  return s?.username || s?.userid || null;
}
function persistResult(uid, payload) {
  try {
    localStorage.setItem(keyFor(uid), JSON.stringify(payload));
  } catch { }
}
function markEverWon(uid) {
  try {
    localStorage.setItem(winEverKeyFor(uid), "1");
  } catch { }
}

/* ====== 컴포넌트 ====== */
export default function Event() {
  const navigate = useNavigate();


  /* UI 상태 */
  const [cards, setCards] = useState(
    Array.from({ length: 6 }, () => ({ opened: false, isWin: null }))
  );
  const [openedIndex, setOpenedIndex] = useState(null);

  // 입장/차단 관련
  const [eligible, setEligible] = useState(false); // 최근 결제 토큰
  const [locked, setLocked] = useState(false); // 예전 참여 기록이 있고 현재 토큰 없음
  const [everWon, setEverWon] = useState(false); // 당첨 이력 존재?

  // 두 번째 기회(첫 시도 꽝인 경우 한 번만)
  const [allowSecond, setAllowSecond] = useState(false);
  const [secondTried, setSecondTried] = useState(false);

  // 당첨 보상 중복 지급 방지(러닝가드)
  const awardingRef = useRef(false);

  /* 초기화 */
  useEffect(() => {
    const uid = getUid();
    const saved = localStorage.getItem(keyFor(uid)) || localStorage.getItem(KEY_BASE);
    const eligibleNow = hasValidRecentPurchase();
    const ever = localStorage.getItem(winEverKeyFor(uid)) === "1";

    setEverWon(ever);
    setEligible(eligibleNow && !ever);
    setLocked(!!saved && !eligibleNow); // 이전 참여 흔적 + 토큰 없음 → 화면에서 안내만
  }, []);

  /* 불꽃놀이(연출) */

  function triggerFirework() {
    const root = document.createElement("div");
    root.className = "firework-root";
    document.body.appendChild(root);
    const COLORS = ["#ff7675", "#fd79a8", "#74b9ff", "#55efc4", "#ffeaa7"];
    const N = 30;
    const cx = window.innerWidth / 2;
    const cy = window.innerHeight / 2;

    for (let i = 0; i < N; i++) {
      const p = document.createElement("span");
      p.className = "fire-particle";
      p.style.background = COLORS[i % COLORS.length];
      p.style.left = cx + "px";
      p.style.top = cy + "px";

      p.style.setProperty("--tx", (Math.random() - 0.5) * 400 + "px");
      p.style.setProperty("--ty", (Math.random() - 0.5) * 400 + "px");
      root.appendChild(p);
    }
    setTimeout(() => root.remove(), 2000);
  }

  /* 당첨 처리(보상 지급, 플래그 저장) — 절대 1번만 */
  function awardOnce(uid) {
    if (!uid) return;
    if (awardingRef.current) return; // 러닝가드
    if (localStorage.getItem(winEverKeyFor(uid)) === "1") return; // 영구가드
    awardingRef.current = true;

    triggerFirework();
    addGifts(uid, 1);
    grantEventCoupon(uid, 1); // 여기서 정확히 1장만 발급되도록 구현되어야 함
    markEverWon(uid);
    setEverWon(true);
    setEligible(false);
    setLocked(true);
  }

  /* 카드 클릭 */
  function onCardClick(idx) {
    const uid = getUid();

    // 차단 조건
    if (everWon) {
      alert("이미 당첨 이력이 있어 참여하실 수 없습니다.");
      return;
    }
    if (!eligible && !(allowSecond && !secondTried)) {
      alert("결제가 완료된 경우에만 참여할 수 있어요.");
      return;
    }
    if (locked && !(allowSecond && !secondTried)) {
      alert("이벤트는 1회만 참여 가능합니다. 마이페이지에서 확인해 주세요.");
      return;
    }

    // 두 번째 시도 규칙: 첫 시도에서 꽝이었을 때, 아직 한 번도 재도전 안했으면 다른 카드 1장 허용
    if (openedIndex !== null && idx !== openedIndex) {
      const first = cards[openedIndex];
      const canSecond = allowSecond && !secondTried && first?.opened && first?.isWin === false;
      if (!canSecond) return;
    }

    // 이미 연 카드면 무시
    if (cards[idx].opened) return;

    // 첫 클릭이면 토큰 소모
    if (openedIndex === null) consumeRecentPurchase();

    // 추첨
    const isWin = Math.random() < WIN_RATE;

    // 상태 반영

    setCards((prev) => {
      const next = prev.slice();
      next[idx] = { opened: true, isWin };
      return next;
    });
    if (openedIndex === null) {
      setOpenedIndex(idx);
      if (!isWin) setAllowSecond(true);
    } else {
      setSecondTried(true);
    }

    // 결과 저장(마이페이지용)
    persistResult(uid, {

      won: isWin,
      prizeName: isWin ? "present_for_you" : null,
      openedAt: new Date().toISOString(),
      source: "event_letters_v1",
      attempt: openedIndex === null ? 1 : 2,
    });

    // 보상 처리
    if (isWin) {
      if (!uid) {
        alert("로그인이 필요합니다. 로그인 후 다시 시도해 주세요.");
        return;
      }
      setAllowSecond(false); // 당첨이면 재도전 의미 없음
      awardOnce(uid);        // ✅ 1회 지급 보장
    }
  }

  return (
    <div className="a_event_wrap" style={{ width: "100%", margin: "0 auto", height: "100vh"  }}>
      <div className="a_event_container">
        {/* 배너 */}
        <div className="a_event_banner">
          <div className="a_event_textbox">
            <p className="a_event_text1">“작은 행운이 담긴 편지를 열어보세요 ”</p>
            <p>당신의 하루에 작은 기쁨을 전합니다.</p>
          </div>
        </div>

        {/* 메인 */}
        <div
          className={
            "a_event_mainbox " +
            (openedIndex !== null
              ? cards[openedIndex].isWin
                ? "is-win"
                : "is-lose"
              : "")
          }
        >
          {/* 차단/안내 메시지 */}
          {(!eligible || locked || everWon) && (
            <div className="already-msg">
              {everWon ? (
                <>
                  이미 이벤트에 <strong>당첨된 이력</strong>이 있어 참여할 수 없습니다.&nbsp;
                  <button onClick={() => navigate("/mypage")} className="already-btn">
                    마이페이지 가기
                  </button>
                </>
              ) : !eligible ? (
                <>
                  결제 완료 후에만 참여할 수 있어요.&nbsp;
                  <button onClick={() => navigate("/")} className="already-btn">
                    쇼핑하러 가기
                  </button>
                </>
              ) : (
                <>
                  이미 참여하셨습니다.&nbsp;
                  <button onClick={() => navigate("/mypage")} className="already-btn">
                    마이페이지 가기
                  </button>
                </>
              )}
            </div>
          )}

          {/* 편지 6장 */}
          <div className="letters">
            {cards.map((c, i) => {
              const src = !c.opened ? IMG.CLOSED : c.isWin ? IMG.WIN : IMG.LOSE;
              const cls =
                "letter" +
                (c.opened ? " opened" : "") +
                (c.isWin ? " win" : c.opened ? " lose" : "");

              return (
                <div
                  key={i}
                  role="button"
                  tabIndex={0}
                  className={cls}
                  onClick={() => {
                    if (cards[i].opened && cards[i].isWin) {
                      navigate("/mypage");
                      return;
                    }
                    onCardClick(i);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      if (cards[i].opened && cards[i].isWin) {
                        navigate("/mypage");
                      } else {
                        onCardClick(i);
                      }
                    }
                  }}
                  title={c.opened && c.isWin ? "마이페이지로 이동" : ""}
                >
                  <img src={src} alt={!c.opened ? "편지" : c.isWin ? "당첨" : "꽝"} />
                </div>
              );
            })}
          </div>

          {/* 팝업 */}
          {openedIndex !== null && (
            <>
              <div className="event-dim" aria-hidden="true" />
              <div className="letter-pop" role="dialog" aria-modal="true">
                <figure className="letter-pop__frame">
                  <img
                    className="letter-pop__img"
                    src={cards[openedIndex].isWin ? IMG.WIN : IMG.LOSE}
                    alt={cards[openedIndex].isWin ? "당첨" : "꽝"}
                    onClick={() => {
                      if (cards[openedIndex].isWin) navigate("/mypage");
                    }}
                    style={{ cursor: cards[openedIndex].isWin ? "pointer" : "default" }}
                  />
                  {!cards[openedIndex].isWin && (
                    <div className="lose-ribbon">아쉽네요! 다른 기회에 다시 도전해주세요</div>
                  )}
                  <div className="letter-pop__actions">
                    <button className="letter-pop__btn btn-brown" onClick={() => navigate("/")}>
                      다시 쇼핑하러 가기
                    </button>
                    <button className="letter-pop__btn btn-green" onClick={() => navigate("/mypage")}>
                      마이페이지 가기
                    </button>
                  </div>
                </figure>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

