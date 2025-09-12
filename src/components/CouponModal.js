import { useEffect, useState } from "react";
import { getSession } from "../utils/localStorage";
import { listCoupons, syncCouponLedgerWithCount, getRewards } from "../utils/rewards";

function fmtDate(ts) {
    const d = new Date(ts);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}.${m}.${day}`;
}

export default function CouponModal({ open, onClose }) {
    const [coupons, setCoupons] = useState([]);

    // 모달이 열릴 때만 쿠폰 목록 로드
    useEffect(() => {
        if (!open) return;
        const s = getSession?.();
        const uid = s?.username || s?.userid || null;
        if (!uid) { setCoupons([]); return; }

        // ✅ 보유 개수와 원장 동기화(과거에 addCoupons만 했던 건 보정)
        syncCouponLedgerWithCount(uid);

        const rows = listCoupons(uid, { includeUsed: true, excludeExpired: false });
        // (선택) 최근 발급순 정렬
        rows.sort((a, b) => new Date(b.issuedAt) - new Date(a.issuedAt));
        setCoupons(rows);
    }, [open]);

    // ESC 닫기: 열려 있을 때만 리스너 등록
    useEffect(() => {
        if (!open) return;
        const onKey = (e) => e.key === "Escape" && onClose?.();
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [open, onClose]);

    const count = coupons.length;

    // ✅ Hooks 호출 뒤에 조건부 렌더
    if (!open) return null;

    return (
        <div className="modal-backdrop" onClick={onClose} aria-hidden="true">
            <div className="coupon-modal" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
                <div className="coupon-modal-hero">
                    <button className="coupon-modal-close" onClick={onClose} aria-label="닫기">
                        <i className="fa-solid fa-xmark" aria-hidden="true"></i>
                    </button>
                </div>

                <div className="coupon-modal-body">
                    <div className="coupon-summary">
                        보유 쿠폰 <strong>{count}</strong>장
                    </div>

                    {count === 0 && <div className="coupon-empty">받은 쿠폰이 없습니다.</div>}

                    <ul className="coupon-list">
                        {coupons.map((c) => {
                            const expired = Date.now() > new Date(c.expiresAt).getTime();
                            return (
                                <li key={c.id} className={`coupon-card ${expired ? "is-expired" : ""}`}>
                                    <div className="coupon-left">
                                        <div className="coupon-rate"><strong>{c.percent ?? 5}%</strong></div>
                                        <div className="coupon-title">{c.title || "할인쿠폰"}</div>
                                    </div>
                                    <div className="coupon-right">
                                        <div className="coupon-row"><span className="label">발급일</span><span className="value">{fmtDate(c.issuedAt)}</span></div>
                                        <div className="coupon-row"><span className="label">사용기한</span><span className="value">{fmtDate(c.expiresAt)} 까지</span></div>
                                        <div className={`coupon-status ${expired ? "expired" : "active"}`}>
                                            {expired ? "만료" : (c.used ? "사용됨" : "사용 가능")}
                                        </div>
                                    </div>
                                </li>
                            );
                        })}
                    </ul>
                </div>
            </div>
        </div>
    );
}
