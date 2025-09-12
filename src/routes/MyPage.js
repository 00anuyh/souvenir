// src/pages/MyPage.jsx
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { Link, useNavigate } from "react-router-dom";
import { getRewards } from "../utils/rewards";
import { getSession } from "../utils/localStorage";
import { loadOrders, ORDERS_UPDATED_EVENT } from "../utils/orders";
import { getCart } from "../utils/cart";

import { HiBell } from "react-icons/hi2";
import { FaGear } from "react-icons/fa6";

import "../css/mypage.css";
import GiftModal from "../components/GiftModal";
import CouponModal from "../components/CouponModal";

const KEY_BASE = "souvenirEventResult";
const keyFor = (uid) => (uid ? `${KEY_BASE}:${uid}` : KEY_BASE);
const CDN = "https://00anuyh.github.io/SouvenirImg/"; // ✅ trailing slash 추가

const fmt = (d) => {
  const date = new Date(d);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${y}.${m}.${day}`;
};
const addDays = (d, n) => {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
};

// ✅ 절대/로컬/상대 경로 모두 안전하게 처리
const resolveImg = (src) => {
  const p = String(src || "");
  if (!p) return `${CDN}Best_img1.png`;                           // 폴백은 CDN 이미지로
  if (/^https?:\/\//i.test(p)) return p;                          // 절대 URL은 그대로
  if (p.startsWith("/img/")) return `${process.env.PUBLIC_URL}${p}`; // 앱 정적자원은 PUBLIC_URL 기준
  return `${CDN}${p.replace(/^\.?\//, "")}`;                      // 상대경로는 CDN에 붙이되 ./, / 제거
};

// cart_v1 기반 보조 변환기 (저장소가 비었을 때만 사용)
function ordersFromCart() {
  const cart = getCart(); // [{ key, name, thumb, price, delivery, qty, purchasedAt, lastOrderId, ... }]
  const tagged = (cart || []).filter((it) => it.purchasedAt && it.lastOrderId);

  const map = new Map();
  for (const it of tagged) {
    const id = String(it.lastOrderId); // 주문번호는 그대로 사용
    const g =
      map.get(id) ||
      {
        orderId: id,
        purchasedAt: 0,
        date: "",
        items: [],
        totals: { product: 0, delivery: 0, grandTotal: 0 },
        status: "결제완료",
      };

    // 카트 라인 → 주문 라인아이템으로 변환
    const item = {
      title: it.name || it.title || "-",
      image: it.image || it.thumb || null, // ★ 없으면 thumb 사용
      optionLabel: it.optionLabel || "",
      qty: Number(it.qty || 1),
      unitPrice: Number(it.price ?? it.unitPrice ?? it.basePrice ?? 0),
      deliveryCost: Number(it.delivery ?? it.deliveryCost ?? 0),
      brand: it.brand || "",
      color: it.color || "-",
      size: it.size || "-",
      orderNo: it.orderNo || "-",
    };

    g.items.push(item);
    g.totals.product += item.unitPrice * item.qty;
    g.totals.delivery += item.deliveryCost;
    g.totals.grandTotal = g.totals.product + g.totals.delivery;

    const paid = Number(it.purchasedAt || 0);
    if (paid > (g.purchasedAt || 0)) {
      g.purchasedAt = paid;
      const d = new Date(paid);
      g.date = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
        d.getDate()
      ).padStart(2, "0")}`;
    }

    map.set(id, g);
  }

  // purchasedAt 내림차순
  return Array.from(map.values()).sort((a, b) => b.purchasedAt - a.purchasedAt);
}

// 원화
const fmtWon = (n) => `${new Intl.NumberFormat("ko-KR").format(Number(n || 0))}원`;

// 날짜 문자열 → Date (YYYY-MM-DD 또는 YYYY.MM.DD)
const toDate = (s) => {
  if (!s) return new Date(0);
  return new Date(String(s).replaceAll(".", "-"));
};

const MyPage = () => {
  const [rewards, setRewardsState] = useState({ points: 0, coupons: 0, gifts: 0 });
  const [eventData, setEventData] = useState(null);
  const [open, setOpen] = useState(false);
  const [openCoupon, setOpenCoupon] = useState(false);
  const [orders, setOrders] = useState([]);

  const { isLoggedIn, user, logoutAll } = useAuth();
  const navigate = useNavigate();
  const isAuthed = !!isLoggedIn?.local;
  const loggedIn = !!isLoggedIn?.local;

  const getUid = () => {
    const s = getSession();
    return s?.username || s?.userid || null;
  };

  const refreshPageData = () => {
    const uid = getUid();

    // 이벤트
    try {
      const raw = localStorage.getItem(keyFor(uid));
      setEventData(raw ? JSON.parse(raw) : null);
    } catch {
      setEventData(null);
    }

    // 리워드
    const r = getRewards(uid);
    setRewardsState({
      points: Number(r.points) || 0,
      coupons: Number(r.coupons) || 0,
      gifts: Number(r.gifts) || 0,
    });

    // ★ 최근주문: 저장소 우선, 없으면 cart_v1 보조
    const saved = loadOrders(uid) || [];
    const fallback = ordersFromCart();
    const base = saved.length ? saved : fallback;
    const sorted = [...base].sort((a, b) => toDate(b.date) - toDate(a.date));
    setOrders(sorted);
  };

  useEffect(() => {
    refreshPageData();
  }, []);
  useEffect(() => {
    if (!isAuthed) {
      setRewardsState({ points: 0, coupons: 0, gifts: 0 });
      setEventData(null);
      setOrders([]);
      return;
    }
    refreshPageData();
  }, [isAuthed]);

  useEffect(() => {
    const onVis = () => {
      if (document.visibilityState === "visible") refreshPageData();
    };
    const onFocus = () => refreshPageData();
    document.addEventListener("visibilitychange", onVis);
    window.addEventListener("focus", onFocus);
    return () => {
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("focus", onFocus);
    };
  }, []);

  // 주문 저장 이벤트 수신 → 즉시 반영
  useEffect(() => {
    const onOrders = (e) => {
      const currentUid = getUid();
      if (!currentUid) return;
      if (e?.detail?.uid && e.detail.uid !== currentUid) return;
      const next = e?.detail?.orders ?? loadOrders(currentUid) ?? [];
      const sorted = [...next].sort((a, b) => toDate(b.date) - toDate(a.date));
      setOrders(sorted);
    };
    window.addEventListener(ORDERS_UPDATED_EVENT, onOrders);
    return () => window.removeEventListener(ORDERS_UPDATED_EVENT, onOrders);
  }, []);

  // 알림
  const [shake, setShake] = useState(false);
  const [silenced, setSilenced] = useState(false);
  const [showNotice, setShowNotice] = useState(false);

  useEffect(() => {
    setSilenced(false);
    setShowNotice(false);
  }, [eventData]);
  useEffect(() => {
    setShake(!!(eventData?.won && !silenced));
  }, [eventData?.won, silenced]);
  const onBellClick = () => {
    if (!eventData?.won) return;
    setSilenced(true);
    setShake(false);
    setShowNotice((v) => !v);
  };

  const handleLogout = async () => {
    try {
      await logoutAll?.();
    } finally {
      navigate("/", { replace: true });
    }
  };

  const modalData = useMemo(() => {
    if (!eventData?.won) return null;
    const received = eventData.openedAt || new Date().toISOString();
    const start = fmt(received);
    const end = fmt(addDays(received, 32));
    return {
      heroImage: "/img/gift_poster.jpg",
      giftType: eventData.prizeName === "present_for_you" ? "인테리어포스터" : "선물",
      receivedAtText: start,
      periodText: `${start} ~ ${end}`,
      shipping: "배송중",
    };
  }, [eventData]);

  // 페이지네이션
  const PER_PAGE = 3;
  const [page, setPage] = useState(1);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil((orders?.length || 0) / PER_PAGE)),
    [orders]
  );

  // 현재 페이지 아이템(최신순 정렬 유지)
  const pagedOrders = useMemo(() => {
    const arr = Array.isArray(orders) ? [...orders] : [];
    arr.sort((a, b) => toDate(b.date) - toDate(a.date));
    const start = (page - 1) * PER_PAGE;
    return arr.slice(start, start + PER_PAGE);
  }, [orders, page]);

  // 주문 목록이 바뀌면 페이지 범위 보정
  useEffect(() => {
    setPage((p) => Math.min(Math.max(1, p), totalPages));
  }, [totalPages]);

  return (
    <>
      <div id="mypage-wrap">
        <div id="mypage-progress">
          <ul>
            <li className="progress1">
              <div className="circle">
                <p>01</p>
              </div>
              <p className="progress-nav">SIGNUP</p>
            </li>
            <li>
              <p className="ntt">
                <i className="fa-solid fa-angle-right" />
              </p>
            </li>
            <li className="progress2">
              <div className="circle">
                <p>02</p>
              </div>
              <p className="progress-nav">LOGIN</p>
            </li>
            <li>
              <p className="ntt">
                <i className="fa-solid fa-angle-right" />
              </p>
            </li>
            <li className="progress3">
              <div className="circle2">
                <p>03</p>
              </div>
              <p className="progress-nav2">MYPAGE</p>
            </li>
          </ul>
        </div>

        <main className="a_mypage">
          {/* 왼쪽 메뉴 */}
          <div className="a_mymenu">
            <nav className="a_mynav">
              <div className="a_nav-title">나의 쇼핑정보</div>
              <Link to="#none">주문배송조회</Link>
              <Link to="#none">취소/교환/반품 내역</Link>
              <Link to="#none">상품 리뷰</Link>
            </nav>
            <nav className="a_mynav">
              <div className="a_nav-title">나의 계정정보</div>
              <Link to="#none">회원정보수정</Link>
              <Link to="#none">나의 멤버십 혜택</Link>
              <Link to="#none">쿠폰</Link>
              <Link to="#none">적립금</Link>
            </nav>
            <nav className="a_mynav">
              <div className="a_nav-title">고객센터</div>
              <Link to="#none">1:1 문의</Link>
              <Link to="#none">FAQ</Link>
              <Link to="#none">고객의 소리</Link>
            </nav>

            <nav className="logout">
              <button
                type="button"
                onClick={handleLogout}
                className="a_nav-title"
                style={{ border: "1px solid #5e472f", cursor: "pointer", borderRadius: 5, padding: 2 }}
              >
                <p>로그아웃하기</p>
              </button>
            </nav>
          </div>

          {/* 오른쪽 콘텐츠 */}
          <section className="a_my-content">
            {/* 프로필 */}
            <div className="a_profile">
              <div className="a_profile-img">
                <i className="fa-solid fa-user" aria-hidden="true"></i>
              </div>
              <div className="a_nickname">
                {loggedIn ? <span>{user?.name || "회원"}</span> : <Link to="/login">로그인이 필요합니다</Link>}
              </div>
              <div className="profile-icons">
                <div
                  className={`bell-wrap ${eventData?.won ? "is-winnable" : "disabled"}`}
                  onClick={onBellClick}
                  role="button"
                  tabIndex={0}
                  aria-disabled={!eventData?.won}
                  aria-live="polite"
                >
                  {eventData?.won && showNotice && <span className="bell-notice">선물이 도착했습니다!</span>}
                  <HiBell
                    style={{ fontSize: 33, cursor: eventData?.won ? "pointer" : "default" }}
                    className={shake ? "bell-shake" : ""}
                    title={eventData?.won ? "선물 알림 보기" : "알림 없음"}
                  />
                </div>
                <FaGear style={{ fontSize: 29 }} />
              </div>
            </div>

            {/* 요약 박스 */}
            <div className="a_myboxs">
              <div className="mybox">
                <div className="mybox-title">
                  <img src="https://00anuyh.github.io/SouvenirImg/coin_icon.svg" alt="coin_icon" />
                  <span>적립금</span>
                </div>
                <div className="mybox-num">{(rewards.points || 0).toLocaleString()} p</div>
              </div>

              <div
                className={`mybox ${rewards.gifts > 0 ? "is-clickable" : "is-disabled"}`}
                role="button"
                tabIndex={0}
                onClick={() => rewards.gifts > 0 && setOpen(true)}
                onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && rewards.gifts > 0 && setOpen(true)}
                title={rewards.gifts > 0 ? "선물 상세 보기" : "받은 선물이 없습니다"}
              >
                <div className="mybox-title">
                  <img src="https://00anuyh.github.io/SouvenirImg/gift_icon.svg" alt="gift_icon" />
                  <span>선물함</span>
                </div>
                <div className="mybox-num">{rewards.gifts || 0}</div>
              </div>

              <div
                className={`mybox ${rewards.coupons > 0 ? "is-clickable" : ""}`}
                role="button"
                tabIndex={0}
                title="쿠폰 내역 보기"
                onClick={() => {
                  if (rewards.coupons <= 0) return; // 보유 0이면 열지 않음
                  setOpen(false); // GiftModal 닫기 (겹침 방지)
                  setOpenCoupon(true); // ✅ 쿠폰 모달 열기
                }}
                onKeyDown={(e) => {
                  if (rewards.coupons <= 0) return;
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setOpen(false);
                    setOpenCoupon(true);
                  }
                }}
              >
                <div className="mybox-title">
                  <img src="https://00anuyh.github.io/SouvenirImg/ticket_icon.svg" alt="ticket_icon" />
                  <span>쿠폰</span>
                </div>
                <div className="mybox-num">{rewards.coupons || 0}</div>
              </div>
            </div>

            {/* 최근주문 */}
            <div className="a_orders">
              <p className="a_order-title">최근주문</p>
              <div className="a_order-con">
                <div className="a_order-sub-title">
                  <div>주문일</div>
                  <div>주문내역</div>
                  <div>결제금액</div>
                  <div>배송상태</div>
                </div>

                {pagedOrders.length === 0 && (
                  <div style={{ padding: "24px 0", textAlign: "center", color: "#666" }}>최근 주문이 없습니다.</div>
                )}

                {pagedOrders.map((o) => {
                  const first = o.items?.[0] || {};
                  const img = resolveImg(first.image || first.thumb); // ★ thumb도 폴백 + 상대경로 보정
                  const when = (o.date || "").replaceAll("-", ".");
                  const total = o.totals?.grandTotal ?? 0;

                  const line1 = first.title || "(상품)";
                  const extraCount = (o.items?.length || 0) - 1;
                  const status = o.status || "결제완료";

                  return (
                    <div className="a_order-box" key={o.orderId}>
                      <div className="a_date">{when}</div>

                      <div className="a_item">
                        <div className="item-img">
                          <img
                            src={img}
                            alt="ordered"
                            onError={(e) => {
                              e.currentTarget.src = `${CDN}Best_img1.png`; // ✅ CDN 폴백
                            }}
                            style={{ width: 80, height: 80, objectFit: "cover", borderRadius: 8 }}
                          />
                        </div>
                        <div className="i-title">
                          <div className="i-line1">{line1}</div>
                          {extraCount > 0 && <div className="i-line2">외 {extraCount}개</div>}
                          <div className="i-orderno">주문번호: {o.orderId}</div>
                        </div>
                      </div>

                      <div className="a_price">{fmtWon(total)}</div>
                      <div className="a_state">{status}</div>
                    </div>
                  );
                })}
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  gap: 16,
                  marginTop: 16,
                  position: "absolute",
                  left: "50%",
                  transform: "translateX(-50%)",
                  bottom: 100,
                }}
              >
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  style={{
                    background: "transparent",
                    border: "none",
                    cursor: page > 1 ? "pointer" : "default",
                    color: page > 1 ? "#333" : "#bbb",
                    fontSize: 18,
                  }}
                  aria-label="이전 페이지"
                  title="이전"
                >
                  &lt;
                </button>

                <span style={{ minWidth: 80, textAlign: "center", fontSize: 14 }}>
                  {page} / {totalPages}
                </span>

                <button
                  type="button"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  style={{
                    background: "transparent",
                    border: "none",
                    cursor: page < totalPages ? "pointer" : "default",
                    color: page < totalPages ? "#333" : "#bbb",
                    fontSize: 18,
                  }}
                  aria-label="다음 페이지"
                  title="다음"
                >
                  &gt;
                </button>
              </div>
            </div>
          </section>
        </main>

        <GiftModal open={open} onClose={() => setOpen(false)} data={modalData || {}} />
        <CouponModal open={openCoupon} onClose={() => setOpenCoupon(false)} />
      </div>
    </>
  );
};

export default MyPage;
