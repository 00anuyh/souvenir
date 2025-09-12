import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Link } from "react-router-dom";

import SignupModal from "../components/SignupModal";
import SocialLogin from "../components/SocialLogin";
import { anyAdminExists } from "../utils/userStore"; 

import '../css/login.css';

export default function Login() {
  const navigate = useNavigate();



  const { loginLocal, logout } = useAuth();
  const [adminOpen, setAdminOpen] = useState(false);
  const [aID, setAID] = useState("");
  const [aPw, setAPw] = useState("");
  const [aErr, setAErr] = useState("");
  const openAdminLogin = () => {
  if (!anyAdminExists()) {
    const go = window.confirm("등록된 관리자가 없습니다. 관리자 생성 페이지로 이동할까요?");
    if (go) navigate("/admin-setup"); // 앞서 만든 AdminSetup 라우트
    return;
  }
  setAdminOpen(true);
};

  const doAdminLogin = async (e) => {
    e.preventDefault();
    setAErr("");
    try {
      const u = await loginLocal(aID.trim(), aPw);
      if (u.role !== "admin") {
        await logout("local");
        throw new Error("관리자 권한이 없습니다.");
      }
      setAdminOpen(false);
      setAID(""); setAPw("");
      navigate("/");
      alert("관리자 로그인 완료!");
    } catch (err) {
      setAErr(err.message || "로그인 실패");
    }
  };



  const { login, setNaverInstance } = useAuth();


  const getUser = (id) => {
    try { return JSON.parse(localStorage.getItem("souvenir_users_v1") || "{}")[id] || null; }
    catch { return null; }
  };
  const setSession = (userid, name) =>
    localStorage.setItem("souvenir_session_v1", JSON.stringify({ userid, name, loginAt: Date.now() }));


  const [form, setForm] = useState({ userid: "", password: "" });
  const [showSignup, setShowSignup] = useState(false);

  const onChange = (e) =>
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const onSubmit = (e) => {
    try {
      const u = getUser(form.userid.trim());
      if (!u || u.pwd !== form.password) {
        alert("아이디 또는 비밀번호가 올바르지 않습니다.");
        return;
      }
      setSession(u.userid, u.name);
      login("local", { name: u.name });
      alert(`${u.name}님 로그인되었습니다.`);
      navigate("/");
    } catch (e) {
      alert("로그인 중 오류가 발생했습니다.");
    }
  };

  return (
    <>

      <div id="login-wrap">
        <main className="login-page">

          <div id="login-progress">
            <ul>
              <li className="progress1">
                <div className="circle"><p>01</p></div>
                <p className="progress-nav">SIGNUP</p>
              </li>
              <li><p className="ntt"><i className="fa-solid fa-angle-right" /></p></li>
              <li className="progress2">
                <div className="circle2"><p>02</p></div>
                <p className="progress-nav2">LOGIN</p>
              </li>
              <li><p className="ntt"><i className="fa-solid fa-angle-right" /></p></li>
              <li className="progress3">
                <div className="circle"><p>03</p></div>
                <p className="progress-nav">MYPAGE</p>
              </li>
            </ul>
          </div>

          <p className="login-title">LOGIN</p>

          <form className="login-card" onSubmit={onSubmit}>
            <div className="field">
              {/* <label className="field-label"></label> */}
              <input
                type="text"
                name="userid"
                value={form.userid}
                onChange={onChange}
                placeholder="아이디"
              />
            </div>

            <label className="field">
              {/* <span className="field-label"></span> */}
              <input
                type="password"
                name="password"
                value={form.password}
                onChange={onChange}
                placeholder="비밀번호"
              />
            </label>

            <div className="loginbtn-box">
              {/* <div className="area"></div> */}
              <button type="submit" className="btn loginbtn">로그인</button>
            </div>

            <div className="sub-links">

              <button type="button" className="link-btn" onClick={openAdminLogin}>
                관리자로그인
              </button>

              <button type="button" className="link-btn" onClick={() => alert("비밀번호 찾기 페이지로 이동")}>
                비밀번호찾기
              </button>


              <button type="button" className="link-btn" onClick={() => setShowSignup(true)}>
                회원가입
              </button>

            </div>
          </form>
          <SocialLogin onNaverReady={setNaverInstance}></SocialLogin>

          {/* 회원가입 모달 */}
          {showSignup && <SignupModal onClose={() => setShowSignup(false)} />}

          {/* 관리자로그인 모달 */}
          {adminOpen && (
            <div className="modal-backdrop" onClick={() => setAdminOpen(false)}>
              <div className="modal-panel" onClick={(e) => e.stopPropagation()}>
                <h3 style={{ fontFamily: "NanumSquareRound" }}>관리자 로그인</h3>
                <form onSubmit={doAdminLogin} className="modal-form">
                  <input
                    type="ID"
                    placeholder="관리자 이메일"
                    value={aID}
                    onChange={(e) => setAID(e.target.value)}
                    required
                  />
                  <input
                    type="password"
                    placeholder="비밀번호"
                    value={aPw}
                    onChange={(e) => setAPw(e.target.value)}
                    required
                  />
                  {aErr && <p className="modal-error">{aErr}</p>}
                  <div className="modal-actions">
                    <button 
                    type="button" 
                    onClick={() => setAdminOpen(false)}
                    style={{ fontFamily: "NanumSquareRound" }}
                    >
                      취소
                      </button>
                    <button type="submit" style={{ fontFamily: "NanumSquareRound" }}>로그인</button>
                  </div>
                </form>
                <div className="modal-sub">
                  <button type="button" onClick={() => navigate("/admin-setup")}  style={{ fontFamily: "NanumSquareRound" }}>
                    관리자 생성 / 승격하기
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
      
    </>
  );
}