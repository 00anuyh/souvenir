import { useEffect, useState } from "react";
import "../css/login.css"; // 모달 스타일도 같은 파일에 포함

import { grantSignupBonusOnce } from "../utils/rewards";//적립금
import { setSession } from "../utils/localStorage";

const USERS_KEY = "souvenir_users_v1";     // { [userid]: user } 형태의 맵으로 저장


const getUsersMap = () => {
  try { return JSON.parse(localStorage.getItem(USERS_KEY) || "{}"); }
  catch { return {}; }
};
const setUsersMap = (map) => localStorage.setItem(USERS_KEY, JSON.stringify(map));
const getUser = (userid) => (userid ? getUsersMap()[userid] || null : null);
const createUser = (user) => {
  const map = getUsersMap();
  if (map[user.userid]) {
    const e = new Error("DUPLICATE");
    e.code = "DUPLICATE";
    throw e;
  }
  map[user.userid] = user; // ⚠️ 데모: 비밀번호 평문 저장(실서비스 금지)
  setUsersMap(map);
};

/* ====== ⬆️ 유틸 끝 ⬆️ ====== */


export default function SignupModal({ onClose }) {
  const [form, setForm] = useState({
    name: "",
    userid: "",
    pwd: "",
    pwd2: "",
    phone1: "",
    phone2: "",
    phone3: "",
    email1: "",
    email2: "",
    mailing: "받겠습니다",
  });

  const onChange = (e) =>
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const pwdMismatch = form.pwd && form.pwd2 && form.pwd !== form.pwd2;

  const checkDuplicate = () => {
    const id = form.userid.trim();
    if (!id) return alert("아이디를 입력해 주세요.");
    const exists = !!getUser(id);
    alert(exists ? "이미 사용 중인 아이디입니다." : "사용 가능한 아이디입니다.");
  };

  const onSubmit = (e) => {
    e.preventDefault();
    const id = form.userid.trim();

    // 간단 검증
    if (!form.name || !id || !form.pwd || !form.pwd2) {
      alert("필수 항목을 입력해 주세요.");
      return;
    }
    if (pwdMismatch) {
      alert("비밀번호가 일치하지 않습니다.");
      return;
    }
    if (getUser(id)) {
      alert("이미 사용 중인 아이디입니다.");
      return;
    }

    // 연락처/이메일 합치기
    const phone = [form.phone1, form.phone2, form.phone3].filter(Boolean).join("-");
    const email =
      form.email1 && form.email2 ? `${form.email1}@${form.email2}` : "";

    try {
      // 저장
      createUser({
        name: form.name,
        userid: id,
        pwd: form.pwd,
        phone,
        email,
        mailing: form.mailing,
        createdAt: Date.now(),
      });

      // 자동 로그인 세션 생성(선택)
      setSession(id); // ✅ 공용 유틸: { username: id, loginAt: ... } 형태로 저장됨

      // ✅ 여기서만! 실제 가입 완료 시 해당 사용자에게 지급
      grantSignupBonusOnce(id);   // ✅ 적립금 +1000, 쿠폰 +1 (1회만)

      alert(`${form.name}님, 회원가입이 완료되었습니다.`);
      onClose(); // 모달 닫기
      // 필요하면 여기서 라우팅: e.g., navigate("/mypage")
    } catch (err) {
      if (err.code === "DUPLICATE") alert("이미 사용 중인 아이디입니다.");
      else alert("회원가입 중 오류가 발생했습니다.");
      console.error(err);
    }
  };

  // ESC 닫기
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true">
      <div className="modal">
        <button className="modal-close" aria-label="닫기" onClick={onClose}>
          <i className="fa-solid fa-xmark"></i>
        </button>

        {/* 회원가입 상단 단계 표시 */}
        <div id="singup-progress">
          <ul>
            <li className="progress">
              <div className="circle2-2 a_circle"><p>01</p></div>
              <p className="progress-nav2-2">SIGNUP</p>
            </li>
            <li><p className="ntt"><i className="fa-solid fa-angle-right" /></p></li>
            <li className="progress">
              <div className="circle2-1 a_circle"><p>02</p></div>
              <p className="progress-nav2-1">LOGIN</p>
            </li>
            <li><p className="ntt"><i className="fa-solid fa-angle-right" /></p></li>
            <li className="progress">
              <div className="circle2-1 a_circle"><p>03</p></div>
              <p className="progress-nav2-1">MYPAGE</p>
            </li>
          </ul>
        </div>

        {/* <h2 className="modal-title">회원가입</h2> */}
        <hr className="modal-line" />

        <form className="signup-form" onSubmit={onSubmit}>
          <label className="field2">
            <span className="field-label2">이름</span>
            <input name="name" value={form.name} onChange={onChange} placeholder="이름을 입력하세요" />
          </label>

          <div className="field2 id-row">
            <span className="field-label2">아이디</span>
            <div className="id-inputs">
              <input name="userid" value={form.userid} onChange={onChange} placeholder="아이디" />
              <button type="button" className="confirmbtn" onClick={checkDuplicate}>중복확인</button>
            </div>
          </div>

          <label className="field2">
            <span className="field-label2">비밀번호</span>
            <input type="password" name="pwd" value={form.pwd} onChange={onChange} placeholder="8~20자 영문/숫자/특수문자" />
          </label>

          <label className="field2">
            <span className="field-label2">비밀번호 확인</span>
            <input type="password" name="pwd2" value={form.pwd2} onChange={onChange} placeholder="비밀번호 확인" />
            {pwdMismatch && <span className="warn">비밀번호가 일치하지 않습니다.</span>}
          </label>

          <div className="field2">
            <span className="field-label2">연락처</span>
            <div className="triple">
              <input name="phone1" value={form.phone1} onChange={onChange} maxLength={3} />
              <input name="phone2" value={form.phone2} onChange={onChange} maxLength={4} />
              <input name="phone3" value={form.phone3} onChange={onChange} maxLength={4} />
            </div>
          </div>

          <div className="field2">
            <span className="field-label2">이메일</span>
            <div className="double">
              <input name="email1" value={form.email1} onChange={onChange} placeholder="example" />
              <span className="at">@</span>
              <input name="email2" value={form.email2} onChange={onChange} placeholder="domain.com" />
            </div>
          </div>

          <label className="field2">
            <span className="field-label2">메일링서비스</span>
            <select name="mailing" value={form.mailing} onChange={onChange}>
              <option>받겠습니다</option>
              <option>받지 않겠습니다</option>
            </select>
          </label>

          <button type="submit" className="singupbtn">회원가입</button>
        </form>
      </div>
    </div>
  );
}