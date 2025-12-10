// main/front/main/src/components/Sidebar.js
import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { logout, getUsername } from '../utils/auth';
import './Sidebar.css';

function Sidebar({ onLogout, open, setOpen }) {
  const location = useLocation();
  const username = getUsername();
  const [menuOpen, setMenuOpen] = useState(false); // 모바일 드롭다운

  const handleLogout = () => {
    logout();
    onLogout && onLogout();
  };

  // 네비 항목 (기존 링크 유지)
  const items = [
    { to: '/dashboard', label: '메인 페이지' },
    { to: '/upload',    label: '서고 업로드' },
    { to: '/notes',     label: '나의 서고 관리' },
    { to: '/explore',   label: '규장각 아카이브' },
  ];

  return (
    <header className="sidebar" role="banner">
      <div className="topbar-inner">
        <div className="topbar-left">
          {/* 모바일 햄버거 */}
          <button
            className="hamburger"
            aria-label="Toggle navigation"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen(v => !v)}
          >
            <span className="hamburger-line" />
            <span className="hamburger-line" />
            <span className="hamburger-line" />
          </button>

          {/* 로고/타이틀 - 기존 제목 유지 */}
          <Link to="/dashboard" style={{ textDecoration: 'none', color: 'inherit' }}>
            <h2 className="sidebar-title">규장각</h2>
          </Link>
        </div>

        {/* 가로 네비게이션 */}
        <nav className={`sidebar-nav ${menuOpen ? 'open' : ''}`} aria-label="Primary navigation">
          <ul>
            {items.map(it => (
              <li key={it.to} className={location.pathname === it.to ? 'active' : ''}>
                <Link to={it.to} onClick={() => setMenuOpen(false)}>
                  {it.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="topbar-right">
          {/* 필요 시 우측에 유저/로그아웃 버튼 배치 */}
          <button onClick={handleLogout} className="sidebar-item" style={{ height: 36 }}>
            로그아웃
          </button>
        </div>
      </div>
    </header>
  );
}

export default Sidebar;
