// src/routes/AdminSetup.jsx
import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
// AdminSetup에서는 실제 로그인(세션 생성)하지 않습니다.
export default function AdminSetup() {
  const nav = useNavigate();

  const [email, setEmail] = useState("33han@souvenir.com");
  const [password, setPassword] = useState("33han");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const emailRef = useRef(null);

  useEffect(() => { emailRef.current?.focus(); }, []);

  const onSubmit = async (e) => {
    e.preventDefault();
    setMsg(""); setLoading(true);
    try {
      // 여기서는 계정 “생성 완료”만 안내하고, 실제 로그인은 Login 페이지의 모달에서 진행
      const normEmail = String(email).trim().toLowerCase();

      // TODO: 별도의 생성 API가 있다면 여기서 호출
      // await fetch('/api/admin/create', { ... })

      setMsg("생성이 완료되었습니다. 로그인 페이지에서 관리자 로그인을 진행해 주세요.");
      // ✅ Login 페이지로 이동하면서, 모달에서 사용할 프리셋(이메일/플래그) 전달
      nav("/Login", { state: { adminReady: true, adminEmail: normEmail } });
    } catch (err) {
      const m = err?.message || "생성에 실패했습니다.";
      setMsg(m);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{maxWidth:"1440px",display:"flex",justifyContent:"center",alignItems:"center",flexDirection:"column",gap:"20px",margin:"50px auto"}}>
      <h2>관리자 생성하기</h2>
      <p style={{ fontSize: 15, color: "#2a2a2a" }}>
        관리자를 이메일/비밀번호로 생성한 뒤, 로그인 페이지에서 <b>관리자 로그인</b> 버튼으로 로그인하세요.
      </p>
      <form onSubmit={onSubmit} style={{ display: "grid", gap: 20 }}>
        <input
          ref={emailRef}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="관리자 이메일"
          type="email"
          required
          autoComplete="username"
          style={{ background: "#FFFADF", padding: "10px 30px", fontSize: 16 }}
        />
        <input
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="비밀번호"
          type="password"
          required
          autoComplete="new-password"
          style={{ background: "#FFFADF", padding: "10px 30px", fontSize: 16 }}
        />
        <button type="submit" disabled={loading}>
          {loading ? "생성 중…" : "생성하기"}
        </button>
      </form>
      {msg && (
        <p style={{ marginTop: 15, color: msg.includes("완료") ? "#2a7a2a" : "#b00020" }}>
          {msg}
        </p>
      )}
    </div>
  );
}
