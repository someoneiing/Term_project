// main/front/main/src/components/Layout.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import { isLoggedIn as checkIsLoggedIn } from '../utils/auth';
import './Layout.css';

function Layout({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth < 900 : false
  );
  const navigate = useNavigate();

  useEffect(() => {
    const loggedIn = checkIsLoggedIn();
    setIsAuthenticated(!!loggedIn);
  }, []);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 900);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleLogout = () => {
    setIsAuthenticated(false);
    navigate('/');
  };

  if (!isAuthenticated) return null;

  // ⬇️ 상단 고정 Topbar + 본문 2단 구성
  return (
    <>
      <Sidebar onLogout={handleLogout} open={sidebarOpen} setOpen={setSidebarOpen} />
      <main className="main-content">
        {children}
      </main>
    </>
  );
}

export default Layout;
