import './header.css'

/* 아이콘 */
import { IoSearch, IoHeartOutline, IoCartOutline } from "react-icons/io5";
import { HiOutlineUser } from "react-icons/hi";
import { NavLink, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "../context/AuthContext"; //유정추가

import Search from './Search.js';

const Header = () => {
  /////유정추가
  const navigate = useNavigate();
  const { isLoggedIn, logoutAll } = useAuth();
  const handleLogout = async () => {
    await logoutAll();
    navigate("/", { replace: true }); // 원하면 /Login 등으로 변경
  };
  const isAuthed = !!isLoggedIn?.local; // 또는 Object.values(isLoggedIn).some(Boolean)

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
          <li><NavLink to="/lifestyle" className={({ isActive }) => isActive ? "active" : undefined}>
            LIFESTYLE
          </NavLink></li>
          <li><NavLink to="/lighting" className={({ isActive }) => isActive ? "active" : undefined}>
            LIGHTING
          </NavLink></li>
          <li><NavLink to="/Objects" className={({ isActive }) => isActive ? "active" : undefined}>
            OBJECTS
          </NavLink></li>
          <li><NavLink to="/BEST" className={({ isActive }) => isActive ? "active" : undefined}>
            BEST
          </NavLink></li>
          <li><NavLink to="/Community" className={({ isActive }) => isActive ? "active" : undefined}>
            COMMUNITY
          </NavLink></li>
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
          <li><NavLink to="/MyPage" className={({ isActive }) => isActive ? "active" : undefined}>
            <HiOutlineUser />
          </NavLink></li>
          <li><NavLink to="/Favorites" className={({ isActive }) => isActive ? "active" : undefined}>
            <IoHeartOutline />
          </NavLink></li>
          <li><NavLink to="/cart" className={({ isActive }) => isActive ? "active" : undefined}>
            <IoCartOutline />
          </NavLink></li>
          {/* 유정추가 */}
          {isAuthed ? (
            // 로그인 상태 → 로그아웃 아이콘
            <li>
              <button
                type="button"
                className="login_btn"
                onClick={handleLogout}
                aria-label="로그아웃"
                title="로그아웃"
              >
                <p>로그아웃</p>
              </button>
            </li>
          ) : (
            // 비로그인 상태 → 로그인 아이콘/링크
            <li className="login_btn_li" >
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
