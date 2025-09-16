// src/components/Chatbot.jsx
import { useState, useRef, useEffect } from "react";
import "../css/Chatbot.css";
import { IoAlertCircle, IoClose } from "react-icons/io5";

const Chatbot = ({ onClose }) => {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState("");
  const [ChatbotData, setChatbotData] = useState(null);
  const messagesEndRef = useRef(null);

  // 푸터 겹침 보정값(px)
  const [avoidFooterOffset, setAvoidFooterOffset] = useState(0);

  /* -------------------- 공통: 푸터 겹침 재계산 -------------------- */
  const recalcFooterOverlap = () => {
    const footer = document.querySelector("footer");
    if (!footer) {
      setAvoidFooterOffset(0);
      return;
    }
    const rect = footer.getBoundingClientRect();
    const vh = window.innerHeight || 0;
    // 화면 하단에서 푸터 top까지의 겹침량(양수일 때만)
    const overlap = Math.max(0, vh - Math.max(rect.top, 0));
    setAvoidFooterOffset(overlap);
  };

  /* -------------------- 메시지 스크롤 -------------------- */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  /* -------------------- 데이터 로딩 -------------------- */
  useEffect(() => {
    (async () => {
      try {
        const url = `${process.env.PUBLIC_URL || ""}/data/chatbotData.json`;
        const res = await fetch(url);
        if (!res.ok) throw new Error("데이터를 가져오지 못했습니다.");
        const data = await res.json();
        setChatbotData(data);
      } catch (e) {
        console.error("Fetch 에러:", e);
      }
    })();
  }, []);

  /* -------------------- 전송 로직 -------------------- */
  const handleSendMessage = () => {
    if (!inputMessage.trim() || !ChatbotData) return;

    const userMessage = { type: "user", text: inputMessage };
    const found = ChatbotData.responses.find((item) =>
      inputMessage.toLowerCase().trim().includes(item.keyword.toLowerCase().trim())
    );
    const botMessage = {
      type: "bot",
      text: found ? found.response : ChatbotData.defaultResponse,
    };

    setMessages((prev) => [...prev, userMessage, botMessage]);
    setInputMessage("");

    // 입력으로 높이가 늘어날 수 있으니 재계산
    requestAnimationFrame(recalcFooterOverlap);
  };

  const handleKeyDown = (e) => e.key === "Enter" && handleSendMessage();

  /* -------------------- ESC 닫기 -------------------- */
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose?.();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  /* -------------------- 모달 오픈 시 푸터 재계산 강화 --------------------
     - 마운트 즉시
     - 다음 프레임
     - 200ms 후(레이아웃 안정화 대비)
     - 스크롤/리사이즈/푸터 ResizeObserver
     - 컨테이너 내부 이미지 로딩 시
  ------------------------------------------------------------------- */
  useEffect(() => {
    // 1) 즉시
    recalcFooterOverlap();
    // 2) 다음 프레임
    const raf = requestAnimationFrame(recalcFooterOverlap);
    // 3) 약간의 지연 후 한 번 더
    const t = setTimeout(recalcFooterOverlap, 200);

    const onScrollResize = () => recalcFooterOverlap();
    window.addEventListener("scroll", onScrollResize, { passive: true });
    window.addEventListener("resize", onScrollResize);

    // 4) 푸터 사이즈 변경 대응
    let ro;
    const footer = document.querySelector("footer");
    if (footer && "ResizeObserver" in window) {
      ro = new ResizeObserver(recalcFooterOverlap);
      ro.observe(footer);
    }

    // 5) 컴포넌트 내부 이미지 로딩 시(배너 등)
    const container = document.querySelector(".chatbot-container");
    const imgs = container ? Array.from(container.querySelectorAll("img")) : [];
    const onImg = () => recalcFooterOverlap();
    imgs.forEach((im) => {
      if (im.complete) return;
      im.addEventListener("load", onImg, { once: true });
      im.addEventListener("error", onImg, { once: true });
    });

    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(t);
      window.removeEventListener("scroll", onScrollResize);
      window.removeEventListener("resize", onScrollResize);
      ro?.disconnect();
      imgs.forEach((im) => {
        im.removeEventListener?.("load", onImg);
        im.removeEventListener?.("error", onImg);
      });
    };
  }, []);

  return (
    <div
      className="chatbot-container"
      style={{
        transform: avoidFooterOffset ? `translateY(-${avoidFooterOffset}px)` : "none",
        willChange: "transform",
      }}
    >
      <div className="chatbot-title">
        <span>Souvenir Chatbot</span>
        <img
          src="https://00anuyh.github.io/SouvenirImg/askicon.png"
          alt="askicon"
          width="50"
          onLoad={recalcFooterOverlap}
          onError={recalcFooterOverlap}
        />
      </div>

      <button onClick={onClose} aria-label="채팅 닫기">
        <IoClose className="Chatbot-Close" style={{ cursor: "pointer" }} />
      </button>

      <div className="chat-notice">
        <div className="chat-noticeicon">
          <IoAlertCircle />
        </div>
        <span>배송지연으로 인해 9월 10일부터 배송이 시작됩니다.</span>
      </div>

      <div className="message-list">
        {messages.map((message, i) => (
          <div key={i} className={message.type === "user" ? "user-message" : "bot-message"}>
            {message.text}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <div className="keyword-container">
        <div className="chat-keyword">교환</div>
        <div className="chat-keyword">배송</div>
        <div className="chat-keyword">환불</div>
        <div className="chat-keyword">사이즈</div>
        <div className="chat-keyword">쿠폰</div>
      </div>

      <div className="input-container">
        <input
          type="text"
          placeholder="메세지를 입력하세요"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <button onClick={handleSendMessage} aria-label="메세지 전송">
          <img
            src="https://00anuyh.github.io/SouvenirImg/a_event_wh_logo.png"
            width={15}
            alt="wh_logo"
            onLoad={recalcFooterOverlap}
            onError={recalcFooterOverlap}
          />
        </button>
      </div>
    </div>
  );
};

export default Chatbot;