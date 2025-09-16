// src/pages/Payment2.jsx
import React from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { spendPoints, setPurchaseFlag, markRecentPurchase, addPoints, markCouponUsed, listCoupons } from "../utils/rewards";


import { getSession } from "../utils/localStorage";
import { saveOrder, createOrderId } from "../utils/orders"; // 존재하지 않으면 try/catch 폴백
import { tagPurchased, removeMany } from "../utils/cart";

import { IoMail } from "react-icons/io5";

import "../css/Payment2.css";

const CDN = "https://00anuyh.github.io/SouvenirImg";

/* ===== 숫자/금액 유틸 ===== */
function toNumber(value, fallback = 0) {
  const n = Number(String(value ?? "").replace(/[^\d.-]/g, ""));
  return Number.isFinite(n) ? n : fallback;
}
function fmtKRW(value) {
  const n = toNumber(value, 0);
  return new Intl.NumberFormat("ko-KR", {
    style: "currency",
    currency: "KRW",
    maximumFractionDigits: 0,
  }).format(n);
}

/* ===== 날짜 유틸 ===== */
function ymd(ts) {
  const d = new Date(ts);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
function addBusinessDays(ts, days = 3) {
  // 간단한 3영업일 계산(주말 제외, 공휴일 제외)
  let d = new Date(ts);
  let added = 0;
  while (added < days) {
    d.setDate(d.getDate() + 1);
    const w = d.getDay(); // 0=일,6=토
    if (w !== 0 && w !== 6) added++;
  }
  return d.getTime();
}

/* ===== 로컬스토리지에서 카트 읽어오기 ===== */
function safeParse(json, fallback = null) {
  try {
    return JSON.parse(json);
  } catch {
    return fallback;
  }
}
function readCartFromLS() {
  if (typeof localStorage === "undefined") return [];
  // 프로젝트별 키가 다를 수 있어 흔한 키들을 순차 시도 (+ cart_v1 포함)
  const KEYS = ["cart_v1", "souvenir_cart_v1", "souvenir_cart", "cart"];
  for (const k of KEYS) {
    const raw = localStorage.getItem(k);
    if (!raw) continue;
    const data = safeParse(raw, null);
    if (!data) continue;
    if (Array.isArray(data)) return data;
    if (Array.isArray(data.items)) return data.items;
    if (Array.isArray(data.lineItems)) return data.lineItems;
  }
  return [];
}

/* ===== Payment2 정규화 ===== */
function normalizeForPayment2(x, i = 0) {
  x = x && typeof x === "object" ? x : {};
  return {
    image: x.image ?? x.thumb ?? x.src ?? "/img/placeholder.png",

    brand: x.brand ?? x.seller ?? "",
    title: x.title ?? x.name ?? "-",
    color: x.color ?? x.optionColor ?? x.colorLabel ?? "-",
    size: x.size ?? x.optionSize ?? x.sizeLabel ?? "-",
    optionLabel: x.optionLabel ?? "",
    qty: toNumber(x.qty ?? x.quantity ?? x.count ?? 1, 1),
    unitPrice: toNumber(x.unitPrice ?? x.price ?? x.basePrice ?? 0, 0),
    deliveryCost: toNumber(
      x.deliveryCost ?? x.shippingFee ?? x.shipping ?? x.delivery ?? 0,
      0
    ),
    orderNo: x.orderNo ?? x.orderId ?? x.id ?? `ORDER-${Date.now()}-${i + 1}`,
    id: x.id ?? `${(x.title ?? x.name ?? "item")}-${i}`,
    slug: x.slug ?? undefined,
    thumb: x.thumb ?? x.image ?? x.src ?? "/img/placeholder.png",

    // ★ 장바구니 원본 key 추적(결제 후 tagPurchased용)
    originalKey: x.sourceKey ?? x.key ?? x.originalKey ?? null,
  };
}
function buildLineItems(payload) {
  const fromState = Array.isArray(payload?.lineItems) ? payload.lineItems : [];
  if (fromState.length) return fromState.map(normalizeForPayment2);
  const fromLS = readCartFromLS();
  if (fromLS.length) return fromLS.map(normalizeForPayment2);
  return [];
}

export default function Payment2() {
  const navigate = useNavigate();
  const location = useLocation();
  const payload = location.state || {};

  /* 세션 */
  const session = getSession();
  const uid = session?.username || session?.userid || null;


  /* ✅ 주문 ID / 구매시각: 컴포넌트 안에서 한 번만 고정 생성 */
  const orderIdRef = React.useRef(payload.orderId || (typeof createOrderId === "function" ? createOrderId() : `ORD-${Date.now()}`));
  const purchasedAtRef = React.useRef(Date.now());
  const orderId = orderIdRef.current;
  const purchasedAt = purchasedAtRef.current;

  /* 아이템/합계 */
  const items = buildLineItems(payload);

  const totals = items.reduce(
    (acc, it) => {
      acc.product += toNumber(it.qty, 1) * toNumber(it.unitPrice, 0);
      acc.delivery += toNumber(it.deliveryCost, 0);
      return acc;
    },
    { product: 0, delivery: 0 }
  );
  const grandTotal = totals.product + totals.delivery;

  const couponData = payload?.coupon;

  // ✅ 쿠폰 금액 산정(모든 케이스 처리)
  let couponAmt = 0;
  if (typeof couponData === "object" && couponData) {
    // 1) amount가 오면 그대로
    couponAmt = toNumber(couponData.amount, 0);

    // 2) amount가 없으면 percent/rate로 계산 (상품합계 기준)
    if (!couponAmt) {
      const rate =
        (typeof couponData.rate === "number" ? couponData.rate : null) ??
        (typeof couponData.percent === "number" ? couponData.percent / 100 : null);
      if (rate) couponAmt = Math.floor(totals.product * rate);
    }

    // 3) 그래도 0이면 원장에서 찾아서 보정
    if (!couponAmt && uid && couponData.id) {
      const found = listCoupons(uid, { includeUsed: true, excludeExpired: false })
        .find(c => c.id === couponData.id);
      if (found) {
        if (found.amount) {
          couponAmt = toNumber(found.amount, 0);
        } else {
          const rate2 =
            (typeof found.rate === "number" ? found.rate : null) ??
            (typeof found.percent === "number" ? found.percent / 100 : null) ?? 0;
          couponAmt = Math.floor(totals.product * rate2);
        }
      }
    }
  } else {
    // 숫자로 넘어오는 경우
    couponAmt = toNumber(couponData ?? 0, 0);
  }
  const pointsUsed = toNumber(payload?.pointsUsed ?? 0, 0);
  const paidTotal = Math.max(0, grandTotal - couponAmt - pointsUsed);


  /* 주소/연락처 표시 */
  const receiver = payload.receiver || "";
  const zip = payload.address?.zip || "";
  const address1 = payload.address?.addr1 || "";
  const address2 = payload.address?.addr2 || "";
  const phone = payload.phone || "";
  const request = payload.deliveryNote || "";

  const onOpenLetter = () => navigate("/Event"); // 라우트에 맞게 /event 라면 수정
  const onKeepShopping = () => navigate(-2);




  /* ✅ 포인트 적립 (6%, 중복 방지) */
  React.useEffect(() => {
    if (!items.length) return;
    const creditKey = `pointsCredited:${orderId}`;
    if (sessionStorage.getItem(creditKey) === "1") return;
    const earn = Math.floor(paidTotal * 0.02);

    if (uid && earn > 0) {
      addPoints(uid, earn);
      sessionStorage.setItem(creditKey, "1");
    }
  }, [uid, items, paidTotal, orderId]);

  /* ✅ 사용한 적립금 차감 (1회만) */
  React.useEffect(() => {
    if (!items.length) return;
    const flag = `pointsDeducted:${orderId}`;
    if (sessionStorage.getItem(flag) === "1") return;
    if (uid && pointsUsed > 0) {
      spendPoints(uid, pointsUsed);
    }
    sessionStorage.setItem(flag, "1");
  }, [uid, items, pointsUsed, orderId]);


  React.useEffect(() => {
    if (!items.length) return;
    const flag = `couponConsumed:${orderId}`;
    if (sessionStorage.getItem(flag) === "1") return;

    const c = (typeof couponData === "object") ? couponData : null;
    if (uid && c?.id) {
      markCouponUsed(uid, c.id); // 원장에 used=true, 보유 개수 감소
    }
    sessionStorage.setItem(flag, "1");
  }, [uid, items, orderId, couponData]);


  /* ✅ 구매 플래그(이벤트 토큰) */
  React.useEffect(() => {
    if (!items.length) return;
    const flag = `purchaseMarked:${orderId}`;
    if (sessionStorage.getItem(flag) === "1") return;
    markRecentPurchase({ orderId, total: grandTotal });
    if (uid) setPurchaseFlag(uid);
    sessionStorage.setItem(flag, "1");
  }, [items, orderId, uid, grandTotal]);

  /* ✅ 장바구니 항목에 '구매됨' 태그 (필요 시 카트 비우기는 주석) */
  React.useEffect(() => {
    if (!items.length) return;
    const flag = `cartTagged:${orderId}`;
    if (sessionStorage.getItem(flag) === "1") return;

    const keys = items.map((it) => it.originalKey).filter(Boolean);
    if (keys.length > 0) {
      // 각 항목에 { lastOrderId, purchasedAt } 기록 → MyPage 최근주문 인식
      tagPurchased(keys, orderId, purchasedAt);
      removeMany(keys); // 결제 후 카트를 비우고 싶으면 주석 해제

    }
    sessionStorage.setItem(flag, "1");
  }, [items, orderId, purchasedAt]);

  /* ✅ 주문 이력 저장 (1) utils/orders.saveOrder 사용 */
  React.useEffect(() => {
    if (!items.length) return;
    const flag = `orderSaved:${orderId}`;
    if (sessionStorage.getItem(flag) === "1") return;

    const paidDateStr = ymd(purchasedAt);

    try {
      if (typeof saveOrder === "function") {
        // MyPage 최근주문용 구조
        saveOrder(uid, {
          orderId,
          date: paidDateStr,
          items: items.map((it) => ({
            title: it.title || "-",
            image: it.image,
            optionLabel: it.optionLabel || "",
            qty: Number(it.qty || 1),
            unitPrice: Number(it.unitPrice || 0),
            deliveryCost: Number(it.deliveryCost || 0),
            brand: it.brand || "",
            color: it.color || "-",
            size: it.size || "-",
            orderNo: it.orderNo || "-",
          })),
          totals: {
            product: totals.product,
            delivery: totals.delivery,
            coupon: couponAmt,
            points: pointsUsed,
            grandTotal: paidTotal,   // ✅ 최종 결제액
          },

          status: "결제완료",
        });
      }
    } catch {
      // 무시하고 (2) localStorage 폴백 저장으로 진행
    }

    /* ✅ 주문 이력 저장 (2) localStorage 폴백 */
    try {
      const orderPayload = {
        orderId,
        createdAt: purchasedAt,
        lineItems: items.map((it) => ({
          id: it.id,
          name: it.title,
          unitPrice: Number(it.unitPrice || 0),
          qty: Number(it.qty || 1),
          delivery: Number(it.deliveryCost || 0),
          thumb: it.image,
          slug: it.slug,
        })),
        subtotal: totals.product,
        shipFee: totals.delivery,
        coupon: couponAmt,
        pointsUsed,
        total: paidTotal,           // ✅ 최종 결제액

        receiver,
        address: { zip, addr1: address1, addr2: address2 },
        phone,
        deliveryNote: request,
        paidDate: paidDateStr,
      };
      localStorage.setItem("lastOrder", JSON.stringify(orderPayload));
      const prevOrders = safeParse(localStorage.getItem("orders"), []);
      const nextOrders = Array.isArray(prevOrders) ? [orderPayload, ...prevOrders] : [orderPayload];
      localStorage.setItem("orders", JSON.stringify(nextOrders));
      localStorage.setItem("recentPurchase", JSON.stringify(orderPayload));
    } catch { }

    sessionStorage.setItem(flag, "1");
  }, [
    items,
    totals.product,
    totals.delivery,
    grandTotal,
    orderId,
    uid,
    purchasedAt,
    payload?.coupon,
    receiver,
    address1,
    address2,
    zip,
    phone,
    request,
  ]);

  // (선택) 커뮤니티 리뷰 작성 이동에 쓰려면 사용
  const goWriteReview = () => {
    navigate("/Community2", {
      state: {
        lineItems: items.map((it) => ({
          id: it.id,
          name: it.title,
          unitPrice: Number(it.unitPrice || 0),
          qty: Number(it.qty || 1),
          delivery: Number(it.deliveryCost || 0),
          thumb: it.image,
          slug: it.slug,
        })),
      },
    });
  };

  /* ===== UI ===== */
  const purchasedDateStr = ymd(purchasedAt);
  const etaStr = ymd(addBusinessDays(purchasedAt, 3)); // 3영업일 이내

  return (
    <div id="cart-wrap" style={{ width: "100%", margin: "0 auto", height: "100vh"  }}>
      {/* 진행바 */}
      <div id="payment-progress">
        <ul>
          <li className="progress1">
            <div className="circle"><p>01</p></div>
            <p className="progress-nav">SHOPPING <br /> BAG</p>
          </li>
          <li><p className="ntt"><i className="fa-solid fa-angle-right"></i></p></li>
          <li className="progress2">
            <div className="circle"><p>02</p></div>
            <p className="progress-nav2">ORDER</p>
          </li>
          <li><p className="ntt"><i className="fa-solid fa-angle-right"></i></p></li>
          <li className="progress3">
            <div className="circle2"><p style={{ color: "#fff"}}>03</p></div>
            <p className="progress-nav">ORDER <br /> CONFIRMED</p>
          </li>
        </ul>
      </div>

      {/* 주문완료 배너 */}
      <div id="payment-final">
        <div className="payment-final-text">
          <p>주문완료!</p>
          <p>구매가 정상적으로 완료되었습니다.</p>
        </div>
        <div className="payment-final-button">
          <button className="payment-final-button1" type="button" onClick={onKeepShopping}>
            <p style={{ color: "#fff"}}>쇼핑계속하기</p>
          </button>
          <button className="payment-final-button2" type="button" onClick={onOpenLetter}>
            <IoMail style={{fontSize: "1.5rem"}} />
            <p style={{ color: "#fff"}}>편지도착</p>
          </button>
        </div>
      </div>

      {/* 주문상품 정보 */}
      <div id="cart-title"><p>주문상품 정보</p></div>

      <div id="cart-item">
        <ul>
          <li>상품정보</li>
          <li></li>
          <li style={{ marginLeft: "50px"}}>배송비</li>
          <li>진행상태</li>
        </ul>
      </div>

      <div id="cart-list">
        {items.map((it, idx) => (
          <div className="cartitem" key={it.id ?? `${it.title}-${idx}`}>
            <div className="cartmaplist">
              <div className="cartitem-img">
                <img
                  src={it.image || it.thumb || `${CDN}/placeholder.png`}
                  alt={`cart-${it.orderNo}`}
                  style={{ width: "200px", height: "200px" }}
                />
              </div>
  
              <div className="cartitem-text">
                <span>{it.brand || ""}</span>
                <p className="cart-item-title">{it.title || "-"}</p>
                <p className="cart-item-color">[color] {it.color || "-"}</p>
                <p className="cart-item-size">[size] {it.size || "-"}</p>
                <p className="cart-item-price">
                  {fmtKRW(it.unitPrice)} (수량 {toNumber(it.qty || 1, 1)}개)
                </p>
                <p className="cart-item-serialnumber">주문번호 : {it.orderNo || "-"}</p>
              </div>
            </div>
            <div className="payment2-delivery-price">
              <p>{toNumber(it.deliveryCost, 0) > 0 ? fmtKRW(it.deliveryCost) : "무료배송"}</p>
            </div>

            <div className="payment2-order-status">
              <p style={{fontSize: "1.2rem"}}>결제완료</p>
              <p>{purchasedDateStr}</p>
              <p>배송예정 <i className="fa-solid fa-truck-fast"></i></p>
              <p>{ymd(addBusinessDays(purchasedAt, 3))} 이내 배송 시작</p>

            </div>
          </div>
        ))}

        {items.length === 0 && (
          <div style={{ padding: "32px 0", textAlign: "center", color: "#666" }}>
            장바구니가 비어있어요.{" "}
            <button className="payment-final-button1" onClick={onKeepShopping}>
              쇼핑하러 가기
            </button>
          </div>
        )}


      </div>

      <div id="order-total">
        <div className="order-total-title" style={{ color: "#5e472f", fontWeight: "600"}}>최종 결제 금액</div>
        <div className="order-total-price" style={{ color: "#5e472f", fontWeight: "600"}}> {fmtKRW(paidTotal)}</div>
      </div>

      {/* 배송정보 요약 */}
      <div id="cart-footer2">
        <div id="cart-total">
          <div className="cart-total-title">
            <h4
              style={{
                fontFamily: "NanumSquareRound",
                color: "#5e472f",
                fontSize: "1.5rem"
              }}
            >배송정보</h4>
          </div>
          <div className="cart-total-list">
            <div className="cart-total-payment4">
              <div className="cart-total-inpo">
                <p>수령인</p>
                <p style={{
                  fontWeight: "500"
                }}>{receiver}</p>
              </div>
              <div className="cart-total-inpo">
                <p>배송지</p>
                <p style={{
                  fontWeight: "500"
                }}> {zip} / {address1} - {address2} </p>
              </div>
              <div className="cart-total-inpo">
                <p>연락처</p>
                <p style={{
                  fontWeight: "500"
                }}>{phone}</p>
              </div>
              <div className="cart-total-inpo">
                <p>배송시 요청사항</p>
                <p style={{
                  fontWeight: "500"
                }}>{request}</p>
              </div>
            </div>
            {/* <div className="cart-total-personal">
                
                
                
            </div> */}
          </div>
        </div>
      </div>
    </div>
  );
}