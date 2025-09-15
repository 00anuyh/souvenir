// src/routes/AdminSetup.jsx
import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAdminAuth } from "../context/AdminAuthContext";

export default function AdminSetup() {
  const nav = useNavigate();

  const auth = useAdminAuth();
  const login = auth?.login;
  const admin = auth?.admin;

  const [email, setEmail] = useState("33han@souvenir.com");
  const [password, setPassword] = useState("33han");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const emailRef = useRef(null);

  useEffect(() => { emailRef.current?.focus(); }, []);

  if (!auth) {
    return (
      <div style={{maxWidth:"1440px",display:"flex",justifyContent:"center",alignItems:"center",flexDirection:"column",gap:"20px",margin:"50px auto"}}>
        <h2>관리자 로그인</h2>
        <p style={{ color: "#b00020" }}>
          내부 설정 필요: <code>AdminAuthProvider</code>로 앱을 감싸주세요.
        </p>
      </div>
    );
  }

  const onSubmit = async (e) => {
    e.preventDefault();
    setMsg(""); setLoading(true);
    try {
      const normEmail = String(email).trim().toLowerCase();
      await login?.(normEmail, String(password));
      setMsg("로그인 성공");
      nav("/admin");
    } catch (err) {
      const m = err?.message === "INVALID_CREDENTIALS"
        ? "이메일 또는 비밀번호가 올바르지 않습니다."
        : err?.message || "로그인에 실패했습니다.";
      setMsg(m);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{maxWidth:"1440px",display:"flex",justifyContent:"center",alignItems:"center",flexDirection:"column",gap:"20px",margin:"50px auto"}}>
      <h2>관리자 로그인</h2>
      {!admin && <p style={{ fontSize: 15, color: "#2a2a2a" }}>관리자는 이메일과 비밀번호로 로그인하세요.</p>}
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
          autoComplete="current-password"
          style={{ background: "#FFFADF", padding: "10px 30px", fontSize: 16 }}
        />
        <button type="submit" disabled={loading}>
          {loading ? "로그인 중…" : "로그인"}
        </button>
      </form>
      {msg && <p style={{ marginTop: 15, color: msg.includes("성공") ? "#2a7a2a" : "#b00020" }}>{msg}</p>}
    </div>
  );
}
