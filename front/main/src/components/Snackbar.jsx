import React, { useEffect, useRef, useState } from 'react';

const COLORS = {
  info: {
    background: '#e3f0ff',
    color: '#1976d2',
    border: '1.5px solid #b3d4fc',
  },
  success: {
    background: '#e8f5e9',
    color: '#2e7d32',
    border: '1.5px solid #c8e6c9',
  },
  error: {
    background: '#ffebee',
    color: '#c62828',
    border: '1.5px solid #ffcdd2',
  }
};

export default function Snackbar({ message, type = 'info', open, duration = 2000, onClose }) {
  const timer = useRef();
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (open) {
      setShow(false);
      // 10ms 후에 show true로 바꿔서 트랜지션 시작
      const enter = setTimeout(() => setShow(true), 10);
      timer.current = setTimeout(() => {
        setShow(false);
        setTimeout(() => {
          onClose && onClose();
        }, 400); // fade-out duration
      }, duration);
      return () => { clearTimeout(timer.current); clearTimeout(enter); };
    } else {
      setShow(false);
    }
  }, [open, duration, onClose]);

  return (
    <div
      style={{
        position: 'fixed',
        right: 24,
        bottom: 24,
        minWidth: 220,
        maxWidth: 340,
        padding: '16px 24px',
        borderRadius: 12,
        textAlign: 'center',
        fontWeight: 600,
        fontSize: '1rem',
        boxShadow: '0 4px 20px rgba(0,0,0,0.10)',
        zIndex: 2000,
        transition: 'opacity 0.4s, transform 0.4s',
        opacity: show ? 1 : 0,
        transform: show ? 'translateY(0)' : 'translateY(40px)',
        pointerEvents: 'none',
        ...COLORS[type],
        whiteSpace: 'pre-line'
      }}
    >
      {message}
    </div>
  );
} 


// import React from 'react';
// import { Link, useLocation } from 'react-router-dom';
// import { logout, getUsername } from '../utils/auth';
// import './Sidebar.css';

// function Sidebar({ onLogout /*, open, setOpen */ }) {
//   const location = useLocation();
//   const username = getUsername();

//   const handleLogout = () => {
//     logout();
//     onLogout();
//   };

//   return (
//     <header className="sidebar">
//       {/* 브랜드 */}
//       <div className="sidebar-header">
//         <Link
//           to="/dashboard"
//           style={{ textDecoration: 'none', color: 'inherit' }}
//         >
//           <h2 className="sidebar-title">규장각</h2>
//           <p>나만의 지식 서고</p>
//         </Link>
//       </div>

//       {/* 네비게이션 */}
//       <nav className="sidebar-nav">
//         <ul>
//           <li className={location.pathname === '/dashboard' ? 'active' : ''}>
//             <Link to="/dashboard">메인 페이지</Link>
//           </li>
//           <li className={location.pathname === '/upload' ? 'active' : ''}>
//             <Link to="/upload">서고 업로드</Link>
//           </li>
//           <li className={location.pathname === '/notes' ? 'active' : ''}>
//             <Link to="/notes">나의 서고 관리</Link>
//           </li>
//           <li className={location.pathname === '/explore' ? 'active' : ''}>
//             <Link to="/explore">규장각 아카이브</Link>
//           </li>
//         </ul>
//       </nav>

//       {/* 우측 사용자/버튼 */}
//       <div className="sidebar-footer">
//         <div className="user-info">
//           <span>{username}님, 반갑습니다</span>
//         </div>
//         <button onClick={handleLogout} className="logout-btn">로그아웃</button>
//       </div>
//     </header>
//   );
// }

// export default Sidebar;
