// src/routes/AdminSetup.jsx
import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";

export default function AdminSetup() {
  const { createAdmin, isAdmin } = useAuth();
  const [ID, setID] = useState("");
  const [pw, setPw] = useState("");
  const [secret, setSecret] = useState("");
  const [msg, setMsg] = useState("");

  const onSubmit = async (e) => {
    e.preventDefault();
    setMsg("");
    try {
      const admin = await createAdmin({ id: ID, password: pw, secret });
      setMsg(`관리자 생성/지정 완료: ${admin.loginId}`);   
    } catch (err) {
      setMsg(err.message || "오류");
    }
  };

  return (
    <div style={{ 
        maxWidth: "1440px", 
        display: "flex", 
        justifyContent: "center", 
        alignItems: "center", 
        flexDirection:"column", 
        gap: "20px", 
        margin: "50px auto" 
        }}>
      <h2>관리자 생성</h2>
      {!isAdmin && <p style={{ fontSize: 15, color: "#2a2a2a" }}>관리자는 비밀코드만 알면 생성할 수 있어요.</p>}
      <form onSubmit={onSubmit} style={{ display: "grid", gap: 20 }}>
        <input value={ID} onChange={(e)=>setID(e.target.value)} placeholder="관리자 아이디" required style={{ background: "#FFFADF", padding: "10px 30px", fontSize: 16  }}/>
        <input value={pw} onChange={(e)=>setPw(e.target.value)} placeholder="비밀번호" type="password" required style={{ background: "#FFFADF", padding: "10px 30px", fontSize: 16  }}/>
        <input value={secret} onChange={(e)=>setSecret(e.target.value)} placeholder="관리자 비밀코드" type="password" required style={{ background: "#FFFADF", padding: "10px 30px", fontSize: 16  }}/>
        <button type="submit">관리자 만들기</button>
      </form>
      {msg && <p style={{ marginTop: 15 }}>{msg}</p>}
    </div>
  );
}
