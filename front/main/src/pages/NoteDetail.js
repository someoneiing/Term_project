import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../utils/api';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import rehypeRaw from 'rehype-raw';
import './NoteDetail.css';
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';
import 'swiper/css/scrollbar';
import { Scrollbar } from 'swiper/modules';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import rehypeHighlight from 'rehype-highlight';
import 'highlight.js/styles/github.css';

pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';

function removeMarkdownCodeBlocks(text) {
  if (!text) return '';
  return text
    .replace(/^```markdown\s*/, '')
    .replace(/^```\s*/, '')
    .replace(/\s*```$/, '')
    .trim();
}

function getFullUrl(url) {
  if (!url) return '';
  if (url.startsWith('http')) return url;
  return process.env.REACT_APP_API_URL + url;
}

function NoteDetail() {
  const { noteId } = useParams();
  const [note, setNote] = useState(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [numPages, setNumPages] = useState(null);
  const [pdfError, setPdfError] = useState(null);
  const navigate = useNavigate();
  const [modalImageIdx, setModalImageIdx] = useState(0);

  useEffect(() => {
    if (!previewOpen) return;
    const onKeyDown = (e) => {
      if (e.key === 'Escape') setPreviewOpen(false);
      if (e.key === 'ArrowLeft') setModalImageIdx((idx) => Math.max(0, idx - 1));
      if (e.key === 'ArrowRight') setModalImageIdx((idx) =>
        Math.min((note?.imageUrls?.length || 1) - 1, idx + 1)
      );
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [previewOpen, note]);

  useEffect(() => {
    api.get(`/api/notes/${noteId}`).then((res) => setNote(res.data));
  }, [noteId]);

  useEffect(() => {
    if (note) {
      const userId = localStorage.getItem('userId');
      if (String(note.userId) !== String(userId) && note.public === false) {
        alert('열람 권한이 없습니다.');
        navigate('/dashboard');
      }
    }
  }, [note]);

  if (!note) return <div style={{ padding: 40 }}>로딩 중...</div>;

  const parsedContent = removeMarkdownCodeBlocks(note.content);
  const handleEdit = () => {
    const userId = localStorage.getItem('userId');
    if (String(note.userId) !== String(userId)) {
      alert('수정 권한이 없습니다.');
      navigate('/dashboard');
      return;
    }
    navigate(`/notes/${noteId}/edit`);
  };
  const isOwner = note && String(note.userId) === String(localStorage.getItem('userId'));

  return (
    <div className="note-detail-wrapper">
      {/* 오른쪽으로 보낼 콘텐츠를 아래로 내리고,
          요약/메타 영역을 먼저 렌더링해서 왼쪽에 오도록 배치 */}
      <div className="note-detail-container">
        <button
          className="back-arrow-btn"
          onClick={() => navigate('/notes')}
          aria-label="뒤로가기"
        >
          <svg
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginBottom: 8 }}>
          <button
            onClick={() => navigate(`/notes/${noteId}/quiz`)}
            style={{
              padding: '8px 18px',
              borderRadius: 8,
              border: 'none',
              background: '#1976d2',
              color: '#fff',
              fontWeight: 600,
              fontSize: '1rem',
              cursor: 'pointer',
            }}
          >
            퀴즈
          </button>
          {isOwner && (
            <button
              className="action-btn edit-btn"
              onClick={handleEdit}
              style={{
                padding: '8px 18px',
                borderRadius: 8,
                border: '1.5px solid #1976d2',
                background: '#fff',
                color: '#1976d2',
                fontWeight: 600,
                fontSize: '1rem',
                cursor: 'pointer',
                transition: 'background 0.2s',
              }}
              onMouseOver={(e) => (e.currentTarget.style.background = '#e3f0ff')}
              onMouseOut={(e) => (e.currentTarget.style.background = '#fff')}
            >
              수정
            </button>
          )}
        </div>

        <h1 className="note-title">{note.title}</h1>

        <div className="note-hashtags">
          {note.keywords && note.keywords.map((k, i) => (
            <span key={i} className="keyword">#{k} </span>
          ))}
        </div>

        <div className="note-meta">
          <span>학기: {note.category}</span> |{' '}
          <span>업로드: {note.createdAt?.slice(0, 10)}</span>
        </div>

        <div className="markdown-body">
          <ReactMarkdown
            remarkPlugins={[remarkGfm, remarkMath]}
            rehypePlugins={[rehypeRaw, rehypeKatex, rehypeHighlight]}
          >
            {parsedContent || '내용 없음'}
          </ReactMarkdown>
        </div>
      </div>

      {/* PDF 미리보기(이제 오른쪽에 위치) */}
      {note.pdfUrl && (
        <div
          style={{
            minWidth: 340,
            maxWidth: 420,
            flex: '0 0 380px',
            background: '#fafbfc',
            borderRadius: 12,
            boxShadow: '0 2px 8px #0001',
            padding: 16,
            marginLeft: 24,              // ← 오른쪽으로 이동했으니 left 마진
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <a
            href={getFullUrl(note.pdfUrl)}
            target="_blank"
            rel="noopener noreferrer"
            style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}
            title="클릭 시 새 창에서 PDF 원본 보기"
          >
            <div
              style={{
                width: 340,
                height: 420,
                overflow: 'auto',
                borderRadius: 8,
                background: '#fff',
                cursor: 'pointer',
              }}
            >
              <Document
                file={getFullUrl(note.pdfUrl)}
                onLoadSuccess={({ numPages }) => setNumPages(numPages)}
                onLoadError={(err) => setPdfError(err?.message || 'PDF 로드 실패')}
                loading={<div style={{ padding: 40 }}>PDF 로딩 중...</div>}
              >
                {numPages &&
                  Array.from({ length: numPages }, (_, i) => (
                    <Page key={i + 1} pageNumber={i + 1} width={320} />
                  ))}
              </Document>
              {pdfError && <div style={{ color: 'red', marginTop: 12 }}>{pdfError}</div>}
            </div>
          </a>
          <div style={{ marginTop: 8, fontSize: '0.97rem', color: '#1976d2', fontWeight: 500 }}>
            원본 서고 보기
          </div>
        </div>
      )}

      {/* 이미지 미리보기(이제 오른쪽에 위치) */}
      {!note.pdfUrl && note.imageUrls && note.imageUrls.length > 0 && (
        <div
          style={{
            minWidth: 340,
            maxWidth: 420,
            flex: '0 0 380px',
            background: '#fafbfc',
            borderRadius: 12,
            boxShadow: '0 2px 8px #0001',
            padding: 16,
            marginLeft: 24,              // ← 오른쪽에 왔으니 left 마진
          }}
        >
          <div style={{ height: 420, overflowY: 'auto' }}>
            {note.imageUrls.map((url, idx) => (
              <div key={idx} style={{ marginBottom: 16 }}>
                <img
                  src={getFullUrl(url)}
                  alt={`노트 이미지${idx + 1}`}
                  style={{
                    width: '100%',
                    maxHeight: 380,
                    objectFit: 'contain',
                    borderRadius: 8,
                    boxShadow: '0 2px 8px #0002',
                    background: '#fff',
                    cursor: 'pointer',
                  }}
                  onClick={() => {
                    setPreviewOpen(true);
                    setModalImageIdx(idx);
                  }}
                />
              </div>
            ))}
          </div>

          {previewOpen && (
            <div
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100vw',
                height: '100vh',
                background: 'rgba(0,0,0,0.5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 1000,
              }}
              onClick={() => setPreviewOpen(false)}
            >
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setModalImageIdx((idx) => Math.max(0, idx - 1));
                }}
                disabled={modalImageIdx === 0}
                style={{
                  position: 'absolute',
                  left: '5vw',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  fontSize: 32,
                  background: 'none',
                  border: 'none',
                  color: '#fff',
                  cursor: 'pointer',
                  zIndex: 1001,
                }}
              >
                &#8592;
              </button>
              <img
                src={getFullUrl(note.imageUrls[modalImageIdx])}
                alt="확대 이미지"
                style={{
                  maxWidth: '90vw',
                  maxHeight: '80vh',
                  borderRadius: 12,
                  boxShadow: '0 4px 24px #0005',
                }}
                onClick={(e) => e.stopPropagation()}
              />
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setModalImageIdx((idx) => Math.min(note.imageUrls.length - 1, idx + 1));
                }}
                disabled={modalImageIdx === note.imageUrls.length - 1}
                style={{
                  position: 'absolute',
                  right: '5vw',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  fontSize: 32,
                  background: 'none',
                  border: 'none',
                  color: '#fff',
                  cursor: 'pointer',
                  zIndex: 1001,
                }}
              >
                &#8594;
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default NoteDetail;
