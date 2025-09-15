// src/components/Header.jsx  (파일명/경로는 현재 그대로)
import './header.css'

/* 아이콘 */
import { IoSearch, IoHeartOutline, IoCartOutline } from "react-icons/io5";
import { HiOutlineUser } from "react-icons/hi";
import { NavLink, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "../context/AuthContext";           // 기존
import { useAdminAuth } from "../context/AdminAuthContext"; // ★ 추가

import Search from './Search.js';

const Header = () => {
  const navigate = useNavigate();
  const { isLoggedIn, logoutAll } = useAuth();

  // ✅ 관리자 세션 (서버 쿠키)
  const { admin, logout: adminLogout } = useAdminAuth() || {};

  // ✅ 기존 로직 유지
  const isAuthed = !!isLoggedIn?.local;

  // ✅ "로컬 or 관리자" 한쪽이라도 로그인이면 true
  const isAnyAuthed = isAuthed || !!admin;

  const handleLogout = async () => {
    try {
      // 관리자면 관리자 세션 정리
      if (admin) await adminLogout?.();
      // 로컬 로그인되어 있으면 로컬 세션 정리
      if (isAuthed) await logoutAll();
    } finally {
      navigate("/", { replace: true });
    }
  };

  const [open, setOpen] = useState(false);

  return (
    <>
      <header>
        <div id="mainheader">
          <NavLink to="/" className={({ isActive }) => isActive ? "active" : undefined}>
            <img src="https://00anuyh.github.io/SouvenirImg/logo.png" alt="logo" id="logo" />
          </NavLink>
        </div>
      </header>

      <nav id="mainnav">
        <ul id="menu1">
          <li><NavLink to="/lifestyle" className={({ isActive }) => isActive ? "active" : undefined}>LIFESTYLE</NavLink></li>
          <li><NavLink to="/lighting" className={({ isActive }) => isActive ? "active" : undefined}>LIGHTING</NavLink></li>
          <li><NavLink to="/Objects" className={({ isActive }) => isActive ? "active" : undefined}>OBJECTS</NavLink></li>
          <li><NavLink to="/BEST" className={({ isActive }) => isActive ? "active" : undefined}>BEST</NavLink></li>
          <li><NavLink to="/Community" className={({ isActive }) => isActive ? "active" : undefined}>COMMUNITY</NavLink></li>
        </ul>

        <ul id="menu2">
          <li>
            <NavLink
              to="#"
              onClick={(e) => { e.preventDefault(); setOpen(true); }}
              className={({ isActive }) => isActive ? "active" : undefined}
              aria-label="검색 열기"
            >
              <IoSearch size={22} />
            </NavLink>
          </li>
          <li><NavLink to="/MyPage" className={({ isActive }) => isActive ? "active" : undefined}><HiOutlineUser /></NavLink></li>
          <li><NavLink to="/Favorites" className={({ isActive }) => isActive ? "active" : undefined}><IoHeartOutline /></NavLink></li>
          <li><NavLink to="/cart" className={({ isActive }) => isActive ? "active" : undefined}><IoCartOutline /></NavLink></li>

          {/* ✅ 여기만 변경: 한 곳에서 OR 처리 */}
          {isAnyAuthed ? (
            <li>
              <button
                type="button"
                className="login_btn"
                onClick={handleLogout}
                aria-label="로그아웃"
                title="로그아웃"
              >
                {/* 관리자인 경우 라벨만 구분 */}
                <p>{admin ? "로그아웃" : "로그아웃"}</p>
              </button>
            </li>
          ) : (
            <li className="login_btn_li">
              <NavLink to="/Login" className={({ isActive }) => isActive ? "active" : undefined}>
                로그인
              </NavLink>
            </li>
          )}
        </ul>
      </nav>

      {/* 검색 모달 */}
      <Search open={open} onClose={() => setOpen(false)} />
    </>
  );
}

export default Header;
