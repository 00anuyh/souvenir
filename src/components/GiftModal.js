import { useEffect } from "react";

export default function GiftModal({ open, onClose, data }) {
  // 훅은 항상 호출하고, 내부에서 open을 체크
  useEffect(() => {
    if (!open) return; // 열렸을 때만 리스너 등록
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  // 렌더는 여기서 조건 처리
  if (!open) return null;

  const {
    giftType = "선물",
    receivedAtText = "-",
    periodText = "-",
    shipping = "-",
  } = data || {};

  return (
    <div className="modal-backdrop" onClick={onClose} aria-hidden>
      <div
        className="gift-modal"
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="gift-modal-hero">
          <button className="gift-modal-close" onClick={onClose} aria-label="닫기">
            <i class="fa-solid fa-xmark"></i>
          </button>
          <div className="gift-imgbox" ><img src="/img/gift_img.png" alt="gift" /></div>
        </div>

        <div className="gift-modal-body">
          <div className="info-row">
            <span className="label">선물 종류</span>
            <span className="value">{giftType}</span>
          </div>
          <div className="info-row">
            <span className="label">받은 날짜</span>
            <span className="value">{receivedAtText}</span>
          </div>
          <div className="info-row">
            <span className="label">유효기간</span>
            <span className="value">{periodText}</span>
          </div>
          <div className="info-row">
            <span className="label">배송상태</span>
            <span className="value">{shipping}</span>
          </div>
        </div>
      </div>
    </div>
  );
}