import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import './Home.css';
import Switch from '@mui/material/Switch';

const summaryText = "이번 강의에서는 정렬하는 방법에 대해 배웠습니다.\n\
            버블, 선택, 삽입 정렬은 구현이 간단하지만 평균 시간 복잡도가 O(n²)으로 느립니다.\n\
            병합, 퀵, 힙 정렬은 '분할 정복' 등을 활용하며, 평균 O(n log n)으로 훨씬 효율적입니다.\n\
            따라서 데이터가 많을 때는 평균 성능이 우수한 퀵 정렬이나 안정적인 병합 정렬이 주로 사용됩니다.";
const titleText = "tmp";

function Home() {
  const [isOn, setIsOn] = useState(false);
  const [typed, setTyped] = useState('');
  const [titleTyped, setTitleTyped] = useState('');
  const typingRef = useRef(null);
  const titleTypingRef = useRef(null);
  const navigate = useNavigate();

  const typingText = summaryText;
  const [summaryTyped, setSummaryTyped] = useState('');

  const isLoggedIn = !!localStorage.getItem('token') || !!localStorage.getItem('userId');

  // summaryText 타이핑 애니메이션
  useEffect(() => {
    let idx = 0;
    let interval = null;
    if (isOn) {
      setSummaryTyped('');
      interval = setInterval(() => {
        setSummaryTyped(prev => {
          if (prev.length < typingText.length) {
            return typingText.slice(0, prev.length + 1);
          } else {
            clearInterval(interval);
            return prev;
          }
        });
      }, 40);
    } else {
      setSummaryTyped('');
    }
    return () => clearInterval(interval);
  }, [isOn, typingText]);

  return (
    <div className="home-root">
      {/* Header */}
      <header className="header">
        <nav className="navbar container">
          <div className="navbar__brand">
            <Link to="/" className="logo-link" onClick={() => window.scrollTo({top:0, behavior:'smooth'})}>
              <span className="logo-text">규장각</span>
            </Link>
          </div>
          <div className="navbar__actions">
            <button
              className="btn btn--outline navbar-btn-transparent"
              onClick={() => navigate(isLoggedIn ? '/dashboard' : '/login')}
            >
              {isLoggedIn ? '대시보드로 가기' : '로그인'}
            </button>
            {!isLoggedIn && (
              <button className="btn btn--primary navbar-btn-transparent" onClick={() => navigate('/signup')}>회원가입</button>
            )}
          </div>
        </nav>
      </header>

      {/* ✅ Features Section (위로 올림) */}
      <section className="features" id="features">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">핵심 기능</h2>
            <p className="section-subtitle">AI 기술로 더 스마트한 학습 경험을 제공합니다</p>
            
          </div>
          <div className="features__grid">
            <div className="feature-card" data-feature="ocr">
              <div className="feature-icon">
                <div className="scan-animation">
                  <div className="scan-line"></div>
                  <div className="scan-document">📄</div>
                </div>
              </div>
              <h3 className="feature-title">AI 기반 문서 보관 시스템</h3>
              <p className="feature-description">손으로 필기한 문서, 디지털 문서 모두 정확하게 디지털 텍스트로 변환해요</p>
            </div>
            <div className="feature-card" data-feature="ai">
              <div className="feature-icon">
                <div className="brain-animation">
                  <div className="brain-icon">🤖</div>
                  <div className="neural-network">
                    <div className="node"></div>
                    <div className="node"></div>
                    <div className="node"></div>
                    <div className="connection"></div>
                    <div className="connection"></div>
                  </div>
                </div>
              </div>
              <h3 className="feature-title">AI 요약</h3>
              <p className="feature-description">AI가 보관된 문서를 정확히 파악하고 요약합니다</p>
            </div>
            <div className="feature-card" data-feature="reminder">
              <div className="feature-icon">
                <div className="calendar-animation">
                  <div className="calendar-icon">📅</div>
                </div>
              </div>
              <h3 className="feature-title">규장각 아카이브</h3>
              <p className="feature-description">내 문서를 보관하고 다른 사용자와 지식을 공유하세요</p>
            </div>
          </div>
        </div>
      </section>

      {/* ✅ Hero Section (아래로 내림) */}
      <section className="hero">
        <div className="hero-bg-image"></div>
        <div className="container">
          <div className="hero__content">
            <div className="hero__text">
              {/* <h1 className="hero__title">
                <span className="typing-text">{titleTyped}<span className="cursor">|</span></span>
              </h1> */}
              <p className="hero__subtitle">내 문서가 디지털 지식이 되는 서고, <br/> 나만의 지식 실록, 규장각.</p>
              <p className="hero__description">
                배움·회의·독서 … 당신의 모든 순간을 기록합니다
              </p>
              <div className="hero__actions">
                <button
                  className="hero-btn hero-btn--primary"
                  onClick={() => navigate(isLoggedIn ? '/dashboard' : '/login')}
                  style={{ background: '#fff', color: '#1976d2', border: '1.5px solid #1976d2', fontWeight: 700 }}
                >
                  서고 입장하기
                </button>
                {/* <button
                  className="hero-btn hero-btn--outline"
                  onClick={() => {
                    const el = document.getElementById('features');
                    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }}
                  style={{ background: '#fff', color: '#1976d2', border: '1.5px solid #1976d2', fontWeight: 700 }}
                >
                  서비스 둘러보기
                </button> */}
              </div>
            </div>

            {/*
            <div className="hero__visual"> … </div>
            */}
          </div>
        </div>
        <div className="hero__background">
          <div className="floating-shapes">
            <div className="shape shape-1"></div>
            <div className="shape shape-2"></div>
            <div className="shape shape-3"></div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="container">
          <div className="footer__bottom">
          </div>
        </div>
      </footer>
    </div>
  );
}

export default Home;
