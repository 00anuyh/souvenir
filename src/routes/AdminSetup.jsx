// src/pages/AdminSetup.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

/**
 * 서버가 /api/admin/setup 을 제공한다고 가정한 페이지.
 * (제공되지 않는 환경에서는 안내만 띄워도 무방)
 */
export default function AdminSetup() {
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState("");

  const onSubmit = async (e) => {
    e.preventDefault();
    setMsg("");
    setSubmitting(true);
    try {
      const r = await fetch("/api/admin/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include", // 쿠키 필요 시
        body: JSON.stringify({ email, password: pw }),
      });
      const data = await r.json().catch(() => ({}));

      if (!r.ok || !data?.ok) {
        const m = data?.error || `SETUP_FAILED_${r.status}`;
        setMsg(m);
        setSubmitting(false);
        return;
      }

      // 완료 후 로그인 화면으로
      nav("/login", {
        replace: true,
        state: { adminReady: true, adminEmail: email.trim() },
      });
    } catch (err) {
      setMsg("NETWORK_ERROR");
      setSubmitting(false);
    }
  };

  return (
    <section style={{ maxWidth: 420, margin: "40px auto", padding: 16 }}>
      <h2>관리자 생성 / 승격</h2>
      <p style={{ color: "#666", marginBottom: 16 }}>
        최초 1회 관리자 계정을 생성하거나 기존 계정을 승격합니다.
      </p>

      <form onSubmit={onSubmit} style={{ display: "grid", gap: 12 }}>
        <label>
          이메일
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="admin@example.com"
            style={{ width: "100%", padding: 8, marginTop: 4 }}
          />
        </label>
        <label>
          비밀번호
          <input
            type="password"
            required
            value={pw}
            onChange={(e) => setPw(e.target.value)}
            placeholder="8자 이상"
            style={{ width: "100%", padding: 8, marginTop: 4 }}
          />
        </label>

        <button
          type="submit"
          disabled={submitting}
          style={{
            padding: "10px 14px",
            background: "#5e472f",
            color: "#fff",
            border: 0,
            borderRadius: 8,
            cursor: "pointer",
            fontWeight: 700,
          }}
        >
          {submitting ? "처리 중..." : "관리자 생성"}
        </button>
        {msg && (
          <div style={{ color: "#c00", fontWeight: 600, marginTop: 8 }}>{msg}</div>
        )}
      </form>

      <div style={{ marginTop: 16 }}>
        <button
          type="button"
          onClick={() => nav("/login")}
          style={{
            background: "transparent",
            color: "#5e472f",
            border: "1px solid #5e472f",
            padding: "10px 14px",
            borderRadius: 8,
            cursor: "pointer",
            fontWeight: 700,
          }}
        >
          로그인으로 돌아가기
        </button>
      </div>
    </section>
  );
}
