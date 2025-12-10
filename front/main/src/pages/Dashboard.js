import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceDot } from 'recharts';
import { useNavigate } from 'react-router-dom';
import { api } from '../utils/api';
import { isValidToken, logout } from '../utils/auth';
import './Dashboard.css';
import './Home.css';
import ReactTooltip from 'react-tooltip';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import rehypeHighlight from 'rehype-highlight';
import 'highlight.js/styles/github.css';

// 에빙하우스 망각곡선 공식 근사치 (x: 일, y: 기억률)
const baseCurve = [
  { day: 0, memory: 100 },
  { day: 1, memory: 33 },
  { day: 3, memory: getMemoryRetention(3) }, // 3일 명시적 추가
  { day: 7, memory: 25 },
  { day: 30, memory: 21 }
];

function getMemoryRetention(day) {
  if (day <= 0.007) return 90;
  if (day <= 1) return 33 + (90 - 33) * (1 - (day - 0.007) / (1 - 0.007));
  if (day <= 7) return 25 + (33 - 25) * (1 - (day - 1) / (7 - 1));
  if (day <= 30) return 21 + (25 - 21) * (1 - (day - 7) / (30 - 7));
  return 21;
}

function getReviewStage(day) {
  if (day == 1) return '1차 복습'; // 0일차(당일)는 표시하지 않음
  else if (day == 3) return '2차 복습';
  else if (day == 7) return '3차 복습';
  else if (day == 30) return '최종 복습';
  return '복습 없음';
}

// 커스텀 마커 툴팁 컴포넌트
const MarkerTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const marker = payload[0].payload;
    if (marker.days !== undefined) {
      return (
        <div style={{ background: '#fff', border: '1px solid #ccc', borderRadius: 8, padding: '6px 12px', fontSize: 14, color: '#333', boxShadow: '0 2px 8px #0002' }}>
          {marker.days}일 경과
        </div>
      );
    }
  }
  return null;
};

function removeMarkdownCodeBlocks(text) {
  if (!text) return '';
  // Remove only prefix/suffix ```markdown or ``` if present
  return text
    .replace(/^```markdown\s*/, '')
    .replace(/^```\s*/, '')
    .replace(/\s*```$/, '')
    .trim();
}

function Dashboard() {
  const [notes, setNotes] = useState([]);
  const [reviewList, setReviewList] = useState([]);
  const [userId, setUserId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [reviewedNotes, setReviewedNotes] = useState([]); // 복습 완료 노트 id
  const [modalOpen, setModalOpen] = useState(false);
  const [modalNote, setModalNote] = useState(null);
  const [completedReviews, setCompletedReviews] = useState({}); // {noteId: true} (제거)
  const navigate = useNavigate();
  const SHOW_REVIEW = false;


  useEffect(() => {
    const uid = localStorage.getItem('userId');
    const token = localStorage.getItem('token');
    if (!uid || isNaN(Number(uid)) || Number(uid) <= 0 || !isValidToken()) {
      logout();
      window.location.href = '/login';
      return;
    }
    setUserId(uid);
  }, []);

  // 노트/복습 히스토리 불러오기
  const fetchNotes = () => {
    if (!userId) return;
    setLoading(true);
    api.get(`/api/notes/user/${userId}`)
      .then(res => {
        setNotes(res.data);
        // 오늘의 복습 리스트: 모든 노트(복습 완료 여부와 무관하게)
        const today = new Date();
        const todayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const todayStr = today.getFullYear() + '-' +
          String(today.getMonth() + 1).padStart(2, '0') + '-' +
          String(today.getDate()).padStart(2, '0');
        const reviews = res.data.map(note => {
          const days = Math.floor((todayDate - new Date(note.createdAt)) / (1000 * 60 * 60 * 24)) + 1;
          const stage = getReviewStage(days);
          const completed = note.lastReviewedDate === todayStr;
          return {
            ...note,
            days,
            reviewStage: completed ? '복습 완료' : stage,
            completed
          };
        }).filter(item => item.reviewStage !== '복습 없음'); // 0일차(당일) 및 복습 없음 제외

        console.log(reviews);
        setReviewList(reviews);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchNotes();
    // eslint-disable-next-line
  }, [userId]);

  // 복습 리스트 정렬 함수
  function getReviewStageOrder(stage) {
    if (stage === '1차 복습') return 1;
    if (stage === '2차 복습') return 2;
    if (stage === '3차 복습') return 3;
    if (stage === '최종 복습') return 4;
    return 99;
  }

  function sortReviewList(list) {
    // 완료된 복습은 마지막으로, 나머지는 단계순 정렬
    const notCompleted = list.filter(item => !item.completed);
    const completed = list.filter(item => item.completed);
    notCompleted.sort((a, b) => getReviewStageOrder(a.reviewStage) - getReviewStageOrder(b.reviewStage));
    return [...notCompleted, ...completed];
  }

  // 복습 완료 처리 (뱃지 색상/텍스트만 변경, 아이템은 그대로, PATCH는 상세에서만)
  const handleReview = (noteId) => {
    setReviewedNotes(prev => [...prev, noteId]);
    navigate(`/notes/${noteId}`);
  };

  // 더미 노트 추가 (테스트용)
  const addDummyNote = async () => {
    if (!userId || isNaN(Number(userId))) return;
    await api.post(`/api/notes`, {
      title: `테스트 노트 ${Math.floor(Math.random()*1000)}`,
      content: '테스트 내용입니다.',
      category: '테스트',
      userId: userId
    });
    fetchNotes();
  };

  // 복습 완료 여부 판별 함수
  const isCompleted = (item) => {
    if (!item.lastReviewedDate) return false;
    // 로컬 타임존 기준 YYYY-MM-DD
    const today = new Date();
    const todayStr = today.getFullYear() + '-' +
      String(today.getMonth() + 1).padStart(2, '0') + '-' +
      String(today.getDate()).padStart(2, '0');
    return item.lastReviewedDate === todayStr;
  };

  // 복습 모달 내 [복습 완료] 버튼 클릭 시 PATCH 요청
  const handleCompleteReview = async (noteId) => {
    await api.patch(`/api/notes/${noteId}/review`);
    setModalOpen(false);
    await fetchNotes();
  };

  // 복습 모달 내 [복습 미완료] 버튼 클릭 시 PATCH 요청
  const handleIncompleteReview = async (noteId) => {
    await api.patch(`/api/notes/${noteId}/unreview`); // 백엔드에서 lastReviewedDate를 null로 처리하는 엔드포인트 필요
    setModalOpen(false);
    await fetchNotes();
  };

  // 망각곡선: 각 경과일(x)마다 ReferenceDot 1개만, label에 노트 개수 표시
  const today2 = new Date();
  const todayDate2 = new Date(today2.getFullYear(), today2.getMonth(), today2.getDate());
  // 경과일별로 노트 그룹핑
  const dayGroups = {};
  notes.forEach(note => {
    // console.log(note);
    // const lastReview = note.reviewHistory && note.reviewHistory.length > 0
    //   ? new Date(note.reviewHistory[note.reviewHistory.length - 1])
    //   : new Date(note.createdAt);
    // const lastReviewDate = new Date(lastReview.getFullYear(), lastReview.getMonth(), lastReview.getDate());
    const createdAt = new Date(note.createdAt);
    const days = Math.floor((todayDate2 - createdAt) / (1000 * 60 * 60 * 24)) + 1;
    if (!dayGroups[days]) dayGroups[days] = [];
    dayGroups[days].push(note);
 // console.log(dayGroups);
  });
  
  // ReferenceDot 데이터: 각 days에 1개, label에 노트 개수
  const noteMarkers = Object.entries(dayGroups).map(([days, notesAtDay]) => ({
    days: Number(days),
    memory: getMemoryRetention(Math.min(days, 30)),
    count: notesAtDay.length,
    notes: notesAtDay
  }));

  return (
    <div className="dashboard-page">
      <div className="dashboard-header">
        <h1>메인 페이지</h1>
        <p>나만의 지식 서고, 규장각</p>
      </div>

{/* 홈: 핵심 기능 (컴팩트) */}
<section className="features features--compact" aria-label="핵심 기능" style={{marginBottom: 8}}>
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

      <div className="feature-card" data-feature="summary">
        <div className="feature-icon">
          <div className="brain-animation">
            <div className="brain-icon">🤖</div>
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


      {/* 상단: 망각곡선 전체 가로 */}
      <div className="dashboard-row">
        <div className="chart-section full-width">
          <h2>최근 기록한 서고들을 확인해보세요!</h2>
          <ResponsiveContainer width="100%" height={320}>
            <LineChart data={baseCurve} margin={{ top: 30, right: 30, left: 10, bottom: 10 }}>
              <XAxis
                dataKey="day"
                type="number"
                domain={[0, 30]}
                ticks={[0, 1, 3, 7, 30]}
                tickFormatter={d => {
                  if (d === 0) return '0';
                  if (d === 1) return '1일';
                  if (d === 3) return '3일';
                  if (d === 7) return '7일';
                  if (d === 30) return '1달';
                  return Math.round(d) + '일';
                }}
              />
              <YAxis dataKey="memory" domain={[0, 100]} tickFormatter={v => v + '%'} />
              <Tooltip content={<MarkerTooltip />} />
              <Line
                type="monotone"
                dataKey="memory"
                stroke="#8884d8"
                strokeWidth={3}
                dot={false}
                isAnimationActive={false}
              />
              {noteMarkers.map(marker => (
                <ReferenceDot
                  key={marker.days}
                  x={marker.days}
                  y={marker.days === 0 ? marker.memory + 6 : marker.memory}
                  r={16}
                  fill="#ff5722"
                  stroke="#fff"
                  strokeWidth={3}
                  isFront
                  cursor="default"
                  label={{ position: 'top', value: marker.count, fontSize: 16, fill: '#333' }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
          <div style={{ fontSize: '0.95rem', color: '#888', marginTop: 8}}>
          
            ※ 마커의 숫자는 당일 업로드한 노트의 개수입니다.<br/>
          </div>
        </div>
      </div>

      {/* 하단: 오늘의 복습, 복습 가이드 2단 */}
      <div className="dashboard-row bottom-row">
        {/* 하단: 오늘의 복습 (숨김) */}
        {SHOW_REVIEW && (
        <div className="dashboard-row bottom-row">

        <div className="today-reviews">
          <h2>📅 오늘의 복습</h2>
          {loading ? (
            <p>로딩 중...</p>
          ) : reviewList.length > 0 ? (
            <div className="review-list">
              {sortReviewList(reviewList).map(item => {
                return (
                  <div
                    key={item.id}
                    className="review-item review-card"
                    onClick={() => { setModalNote(item); setModalOpen(true); }}
                    style={{ cursor: 'pointer' }}
                  >
                    <div className="review-title-row">
                      <span className="review-title">{item.title}</span>
                      <span className="category-badge">{item.category}</span>
                      {item.completed ? (
                        <span className="badge badge-green">복습 완료</span>
                      ) : (
                        <span className="badge badge-red">{item.reviewStage}</span>
                      )}
                    </div>
                    <div className="review-meta">
                      <span className="upload-date">업로드: {item.createdAt?.slice(0, 10)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{textAlign:'center', color:'#bbb', marginTop:32}}>
              <p className="no-reviews">오늘 복습할 노트가 없습니다! 🎉</p>
              <button className="dummy-btn" onClick={() => navigate('/upload')}>노트 추가</button>
            </div>
          )}
        </div>
        </div>
        )}
        {/* <div className="review-guide">
          <h2>💡 복습 가이드</h2>
          <div className="guide-content">
            <div className="guide-step">
              <h3>1일 후 - 1차 복습</h3>
              <p>핵심 개념 정리 및 요약 복습</p>
            </div>
            <div className="guide-step">
              <h3>3일 후 - 2차 복습</h3>
              <p>문제 풀이 및 응용 연습</p>
            </div>
            <div className="guide-step">
              <h3>7일 후 - 3차 복습</h3>
              <p>약점 보완 및 심화 학습</p>
            </div>
            <div className="guide-step">
              <h3>30일 후 - 4차 복습</h3>
              <p>종합 정리 및 최종 점검</p>
            </div>
          </div>
        </div> */}
      </div>

      {/* 복습 모달 */}
      {modalOpen && modalNote && (
        <div className="modal-overlay-center" onClick={() => setModalOpen(false)}>
          <div className="modal-content-center" onClick={e => e.stopPropagation()}>
            <h2 className="modal-note-title">{modalNote.title}</h2>
            <div className="modal-note-meta">
              <span>카테고리: {modalNote.category}</span>
              <span>업로드: {modalNote.createdAt?.slice(0, 10)}</span>
              <span>복습단계: {modalNote.reviewStage}</span>
            </div>
            <div className="modal-note-content">
              <ReactMarkdown
                remarkPlugins={[remarkGfm, remarkMath]}
                rehypePlugins={[rehypeKatex, rehypeHighlight]}
              >
                {removeMarkdownCodeBlocks(modalNote.content) || '내용 없음'}
              </ReactMarkdown>
            </div>
            <div className="modal-note-actions">
            <button
              className="modal-complete-btn"
              onClick={() => handleCompleteReview(modalNote.id)}
              >복습 완료</button>
              <button
                className="modal-incomplete-btn"
                onClick={() => handleIncompleteReview(modalNote.id)}
              >복습 미완료</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard; 