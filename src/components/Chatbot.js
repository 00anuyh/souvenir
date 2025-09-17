// src/components/Chatbot.jsx
import { useState, useRef, useEffect } from "react";
import "../css/Chatbot.css";
import { IoAlertCircle, IoClose } from "react-icons/io5";

const Chatbot = ({ onClose }) => {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState("");
  const [ChatbotData, setChatbotData] = useState(null);

  const messagesEndRef = useRef(null);
  const keywordRef = useRef(null);

  const KEYWORDS = ["교환", "배송", "환불", "사이즈", "쿠폰", "회원가입", "이벤트", "결제"];

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

  /* -------------------- 챗봇 응답 찾기 -------------------- */
  const findBotResponse = (query) => {
    if (!ChatbotData) return null;
    const q = query.toLowerCase().trim();
    const found = ChatbotData.responses.find((item) =>
      q.includes(item.keyword.toLowerCase().trim())
    );
    return found ? found.response : ChatbotData.defaultResponse;
  };

  /* -------------------- 전송(공통) -------------------- */
  const sendMessage = (text) => {
    const q = String(text || "").trim();
    if (!q || !ChatbotData) return;

    const userMessage = { type: "user", text: q };
    const botMessage = { type: "bot", text: findBotResponse(q) };

    setMessages((prev) => [...prev, userMessage, botMessage]);
    setInputMessage("");
    requestAnimationFrame(recalcFooterOverlap);
  };

  /* -------------------- 전송 로직 -------------------- */
  const handleSendMessage = () => sendMessage(inputMessage);
  const handleKeyDown = (e) => {
    // IME(한글) 조합 중, 혹은 Shift+Enter는 줄바꿈만
    if (e.isComposing) return;
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  /* -------------------- ESC 닫기 -------------------- */
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose?.();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  /* -------------------- 모달 오픈 시 푸터 재계산 강화 -------------------- */
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
      ro = new ResizeObserver(() => {
        // 🔧 루프 에러 방지: rAF로 한 프레임 뒤에 계산
        requestAnimationFrame(recalcFooterOverlap);
      });
      ro.observe(footer);

      // ✅ 초기 1회 계산(옵저버 첫 콜백 전에 빈틈 방지)
      recalcFooterOverlap();
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

  /* -------------------- 키워드 컨테이너: 마우스 휠 → 가로 스크롤 -------------------- */
  useEffect(() => {
    const el = keywordRef.current;
    if (!el) return;

    const onWheel = (e) => {
      if (e.deltaY === 0) return; // 세로 스크롤 없으면 무시
      e.preventDefault();
      el.scrollBy({
        left: e.deltaY, // 세로 휠 값 → 가로 스크롤로 변환
        behavior: "smooth",
      });
    };

    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
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

      <div
        ref={keywordRef}
        className="keyword-container"
        aria-label="빠른 질문 키워드"
      >
        {KEYWORDS.map((kw) => (
          <button
            key={kw}
            type="button"
            className="chat-keyword"
            onClick={(e) => (e.shiftKey ? setInputMessage(kw) : sendMessage(kw))} // Shift+클릭=입력창만
            disabled={!ChatbotData}
          >
            {kw}
          </button>
        ))}
      </div>

      <div className="input-container">
        <input
          type="text"
          placeholder="메세지를 입력하세요"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <button onClick={handleSendMessage} aria-label="메세지 전송" disabled={!ChatbotData}>
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
