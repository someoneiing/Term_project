// main/front/main/src/pages/NoteQuiz.js
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api, aiApi } from '../utils/api';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import rehypeHighlight from 'rehype-highlight';
import 'highlight.js/styles/github.css';
import Snackbar from '../components/Snackbar';

function NoteQuiz() {
  const { noteId } = useParams();
  const [note, setNote] = useState(null);
  const [quiz, setQuiz] = useState([]);
  const [current, setCurrent] = useState(0);
  const [score, setScore] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [selected, setSelected] = useState(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', type: 'info' });
  const showSnackbar = (message, type = 'info', duration = 4000) => {
    setSnackbar({ open: true, message, type, duration });
  };
  const navigate = useNavigate();

  // 🔧 레이아웃용: 넓은 화면 판별 (좌측 고정/우측 분할 적용)
  const [isWide, setIsWide] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth >= 1024 : false
  );
  useEffect(() => {
    const onResize = () => setIsWide(window.innerWidth >= 1024);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // 퀴즈 재생성
  const handleRetryQuiz = async () => {
    try {
      await api.post(`/api/notes/${noteId}/quiz/retry`);
      const res = await api.get(`/api/notes/${noteId}/quiz`);
      setQuiz(res.data);
      if (res.data.length > 0) {
        showSnackbar('퀴즈가 새로 생성되었습니다!', 'success');
      } else {
        showSnackbar('퀴즈 생성에 실패했습니다.', 'error');
      }
    } catch (e) {
      showSnackbar('퀴즈 생성 중 오류가 발생했습니다.', 'error');
    }
  };

  useEffect(() => {
    api.get(`/api/notes/${noteId}`).then(res => setNote(res.data));
    api.get(`/api/notes/${noteId}/quiz`).then(res => {
      setQuiz(res.data);
      if (res.data.length === 0) {
        showSnackbar('퀴즈 생성에 실패했습니다. 노트 내용을 확인하거나 다시 시도해 주세요.', 'error', 4000);
      }
    });
  }, [noteId]);

  useEffect(() => {
    if (note) {
      const userId = localStorage.getItem('userId');
      if (String(note.userId) !== String(userId) && note.public === false) {
        alert('퀴즈 권한이 없습니다.');
        navigate('/dashboard');
      }
    }
  }, [note, navigate]);

  if (!note) return <div style={{padding:40}}>로딩 중...</div>;
  if (!quiz.length) return (
    <div style={{
      minHeight: '90vh',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      maxWidth: 600,
      margin: '0 auto',
      padding: 32,
      fontSize: '1.2rem',
      color: '#888',
      fontWeight: 500
    }}>
      <h1>⚠️</h1>
      <h2>퀴즈가 없습니다.</h2>
      퀴즈 생성 중 오류가 발생했습니다.<br/>
      노트를 다시 업로드 하여 시도해주세요.
      <button
        style={{
          marginTop: 24,
          padding: '12px 32px',
          borderRadius: 8,
          border: 'none',
          background: '#1976d2',
          color: '#fff',
          fontWeight: 700,
          fontSize: '1rem',
          cursor: 'pointer'
        }}
        onClick={handleRetryQuiz}
      >
        퀴즈 다시 생성하기
      </button>
    </div>
  );

  const handleAnswer = (idx) => {
    setSelected(idx);
    const isCorrect = quiz[current].answerIndex === idx;
    if (isCorrect) setScore(score + 1);

    setShowExplanation(true);

    setTimeout(() => {
      setShowExplanation(false);
      if (current + 1 < quiz.length) {
        setCurrent(current + 1);
        setSelected(null);
      } else {
        setShowResult(true);
      }
    }, 4000);
  };

  // 문제(질문 텍스트) 마크다운: block 코드블럭
  const markdownQuestionComponents = {
    pre: ({node, ...props}) => (
      <pre style={{
        textAlign: 'left',
        display: 'block',
        margin: '16px 0',
        background: '#f5f5f5',
        borderRadius: 6,
        padding: '12px',
        fontSize: '1em'
      }} {...props} />
    )
  };
  // 보기/해설 인라인 코드
  const markdownInlineComponents = {
    p: ({node, ...props}) => <span {...props} />,
    pre: ({node, ...props}) => <span {...props} style={{}} />,
    code: ({node, ...props}) => <code {...props} style={{display:'inline',background:'#f5f5f5',borderRadius:4,padding:'2px 6px',fontSize:'0.98em'}} />
  };

  return (
    <div style={{
      minHeight: '90vh',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      maxWidth: isWide ? 1024 : 600,   // 넓은 화면일 때 폭 확장
      margin: '0 auto',
      padding: 32,
      width: '100%'
    }}>
      {/* 맨 위 중앙 타이틀 */}
      <h2 style={{textAlign:'center', marginBottom: 80}}>
        {note.title} 퀴즈
      </h2>

      {showResult ? (
        <div style={{textAlign:'center'}}>
          <h3>퀴즈 완료!</h3>
          <p>점수: {score} / {quiz.length}</p>
          <button
            onClick={() => navigate(-1)}
            style={{marginTop:20,padding:'12px 32px',borderRadius:8,border:'none',background:'#1976d2',color:'#fff',fontWeight:700,fontSize:'1rem'}}
          >
            돌아가기
          </button>
        </div>
      ) : (
        // 좌측 고정 질문 / 우측 일렬 보기
        <div style={{
          display: isWide ? 'grid' : 'block',
          gridTemplateColumns: isWide ? '1.15fr 1fr' : undefined,
          gap: isWide ? 24 : 0,
          alignItems: 'start',
          width: '100%'
        }}>
          {/* 왼쪽: 질문(Sticky) */}
          <div style={{
            position: isWide ? 'sticky' : 'static',
            top: 90   /* 상단바 높이에 맞춰 필요시 조절 */,
          }}>
            <div style={{marginBottom:18,fontWeight:600}}>
              문제 {current+1} / {quiz.length}
            </div>
            <div style={{marginBottom:18,fontSize:'1.1rem',fontWeight:500,textAlign:'center',alignSelf:'stretch'}}>
              <ReactMarkdown
                remarkPlugins={[remarkGfm, remarkMath]}
                rehypePlugins={[rehypeKatex, rehypeHighlight]}
                components={markdownQuestionComponents}
              >
                {quiz[current].question}
              </ReactMarkdown>
            </div>
          </div>

          {/* 오른쪽: 보기(세로 일렬) */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
            marginTop: isWide ? 0 : 12
          }}>
            {quiz[current].options.map((opt, idx) => (
              <button
                key={idx}
                onClick={() => handleAnswer(idx)}
                disabled={selected !== null}
                style={{
                  width:'100%',
                  padding:'12px',
                  borderRadius:8,
                  border:'1px solid #ddd',
                  background:selected===idx
                    ? (quiz[current].answerIndex===idx ? '#c8e6c9' : '#ffcdd2')
                    : '#fff',
                  color:'#222',
                  fontWeight:600,
                  fontSize:'1rem',
                  cursor:selected===null?'pointer':'default',
                  transition:'background 0.2s'
                }}>
                {String.fromCharCode(65+idx)}.&nbsp;
                <ReactMarkdown
                  remarkPlugins={[remarkGfm, remarkMath]}
                  rehypePlugins={[rehypeKatex, rehypeHighlight]}
                  components={markdownInlineComponents}
                >
                  {opt}
                </ReactMarkdown>
              </button>
            ))}

            {/* 해설은 보기 아래에 표시 */}
            {showExplanation && (
              <div style={{
                marginTop: 6,
                background: selected === quiz[current].answerIndex ? '#e8f5e8' : '#ffebee',
                border: `1px solid ${selected === quiz[current].answerIndex ? '#c8e6c9' : '#ffcdd2'}`,
                borderRadius: 8,
                padding: '16px',
                color: selected === quiz[current].answerIndex ? '#2e7d32' : '#c62828',
                fontWeight: 600,
                fontSize: '1rem',
                textAlign: 'center'
              }}>
                <div style={{marginBottom: 8, fontSize: '0.9rem', opacity: 0.8}}>
                  {selected === quiz[current].answerIndex ? '✅ 정답입니다!' : '❌ 오답입니다.'}
                </div>
                <ReactMarkdown
                  remarkPlugins={[remarkGfm, remarkMath]}
                  rehypePlugins={[rehypeKatex, rehypeHighlight]}
                >
                  {quiz[current].explanation || '해설 없음'}
                </ReactMarkdown>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 스낵바 */}
      <Snackbar
        message={snackbar.message}
        type={snackbar.type}
        open={snackbar.open}
        duration={snackbar.duration}
        onClose={() => setSnackbar(s => ({ ...s, open: false }))}
      />
    </div>
  );
}

export default NoteQuiz;
