import React, { useState, useRef, useEffect } from 'react';
import './Upload.css';
import { api, aiApi } from '../utils/api';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import { useNavigate } from 'react-router-dom';
import Snackbar from '../components/Snackbar';
pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';

function Upload() {
  const [selectedImages, setSelectedImages] = useState([]); // File[]
  const [imagePreviews, setImagePreviews] = useState([]); // string[]
  const [selectedPdf, setSelectedPdf] = useState(null); // File
  const [pdfName, setPdfName] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalImageIdx, setModalImageIdx] = useState(0);
  const [keywords, setKeywords] = useState(''); // 키워드
  const [description, setDescription] = useState(''); // 기타 설명
  const [title, setTitle] = useState(''); // 과목명
  const [category, setCategory] = useState(''); // 이수학기
  const [isUploading, setIsUploading] = useState(false);
  const [numPages, setNumPages] = useState(null);
  const [pdfPage, setPdfPage] = useState(1);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', type: 'info' });
  const [isPublic, setIsPublic] = useState(false);

  const showSnackbar = (message, type = 'info', duration = 3000) => {
    setSnackbar({ open: true, message, type, duration });
  };

  const subjectOptions = [
    '개인 공부',
    '프로젝트',
    '필사 노트',
    '일기장',
    '독서 노트',
    '회의록',
    '세미나·강연 노트',
    '업무 기록',
    '여행·취미 기록',
    '기타'
  ];

  


  const semesterOptions = [
    '학교', '직장', '여가', '작업물','기타'
  ];

  const pdfInputRef = useRef();
  const navigate = useNavigate();

  // 이미지 여러 장 선택
  const handleImageSelect = (event) => {
    const files = Array.from(event.target.files);
    const validImages = files.filter(f => f.type.startsWith('image/'));
    if (validImages.length > 20) {
      showSnackbar('이미지는 최대 20장까지 업로드할 수 있습니다.', 'error');
      setSelectedImages([]);
      setImagePreviews([]);
      return;
    }
    setSelectedImages(validImages);
    setImagePreviews(validImages.map(f => URL.createObjectURL(f)));
  };

  // PDF 선택
  const handlePdfSelect = (event) => {
    const file = event.target.files[0];
    if (file && file.type === 'application/pdf') {
      setSelectedPdf(file);
      setPdfName(file.name);
    } else {
      showSnackbar('PDF 파일만 업로드 가능합니다.', 'error');
      setSelectedPdf(null);
      setPdfName('');
    }
  };

  const handleUpload = async () => {
    if ((!selectedImages.length && !selectedPdf) || !keywords || !title || !category) {
      showSnackbar('모든 필드를 입력해주세요.', 'error');
      return;
    }
    setIsUploading(true);
    showSnackbar('파일 업로드 중...', 'info');
    try {
      // 1. 파일 업로드
      const formData = new FormData();
      selectedImages.forEach(img => formData.append('images', img));
      if (selectedPdf) formData.append('pdf', selectedPdf);
      const fileRes = await api.post('/api/notes/upload-files', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const { imageUrls, pdfUrl } = fileRes.data;
      showSnackbar('노트 정보 저장 중...', 'info');
      // 2. 노트 정보 업로드
      const keywordsArr = keywords.split(',').map(k => k.trim()).filter(Boolean).slice(0, 5);
      const userId = localStorage.getItem('userId');
      const noteRes = await api.post('/api/notes', {
        userId,
        title,
        category,
        keywords: keywordsArr,
        description,
        imageUrls,
        pdfUrl,
        content: '', // GPT 요약은 추후
        isPublic,
      });
      setIsUploading(false);
      showSnackbar('✅ 노트가 성공적으로 업로드되었습니다!', 'success');
      setSelectedImages([]);
      setImagePreviews([]);
      setSelectedPdf(null);
      setPdfName('');
      setKeywords('');
      setTitle('');
      setCategory('');
      setDescription('');
      setIsPublic(false);
      // 업로드된 노트 상세로 이동
      if (noteRes.data && noteRes.data.id) {
        navigate(`/notes/${noteRes.data.id}`);
      }
    } catch (err) {
      setIsUploading(false);
      showSnackbar('업로드 실패: ' + (err?.response?.data?.message || err.message), 'error');
    }
  };

  // 이미지 삭제
  const handleDeleteImage = (idx) => {
    setSelectedImages(selectedImages.filter((_, i) => i !== idx));
    setImagePreviews(imagePreviews.filter((_, i) => i !== idx));
  };

  // PDF 삭제
  const handleDeletePdf = () => {
    setSelectedPdf(null);
    setPdfName('');
    if (pdfInputRef.current) {
      pdfInputRef.current.value = '';
    }
  };

  // 전체 삭제
  const handleClearAll = () => {
    setSelectedImages([]);
    setImagePreviews([]);
    setSelectedPdf(null);
    setPdfName('');
    if (pdfInputRef.current) pdfInputRef.current.value = '';
  };

  // 이미지 확대 모달 닫기
  const handleCloseModal = () => setIsModalOpen(false);

  // 키보드 ESC/좌우로 모달 닫기/이동
  useEffect(() => {
    if (!isModalOpen) return;
    const onKeyDown = (e) => {
      if (e.key === 'Escape') setIsModalOpen(false);
      if (e.key === 'ArrowLeft') setModalImageIdx(idx => Math.max(0, idx - 1));
      if (e.key === 'ArrowRight') setModalImageIdx(idx => Math.min(imagePreviews.length - 1, idx + 1));
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isModalOpen, imagePreviews.length]);

  return (
    <div className="upload">
      <div className="upload-header">
        <h1>서고 업로드</h1>
        <p>문서를 업로드하여 관리하세요, AI가 요약 관리 기능을 제공해요</p>
       
      </div>

      <div className="upload-content">
        <div className="upload-card">
          <div className="upload-section">
            <h2>보관할 문서 선택</h2>
            <div className="file-upload-area">
              {/* 이미지 업로드: PDF가 선택되지 않은 경우에만 노출 */}
              {!selectedPdf && (
                <>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageSelect}
                    id="file-input"
                    className="file-input"
                  />
                  {imagePreviews.length === 0 && (
                    <label htmlFor="file-input" className="file-label">
                      <div className="upload-placeholder">
                        <span>📷</span>
                        <p>이미지 파일</p>
                        <small>(JPG, PNG, GIF)</small>
                        <span></span>
                        <p>또는</p>
                      </div>
                    </label>
                  )}
                  {imagePreviews.length > 0 && (
                    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 12, justifyContent: 'center', width: '100%' }}>
                      {imagePreviews.map((url, idx) => (
                        <div key={url} style={{ position: 'relative', display: 'inline-block' }}>
                  <img
                            src={url}
                            alt={`미리보기${idx+1}`}
                            style={{ maxWidth: 120, maxHeight: 120, borderRadius: 8, boxShadow: '0 2px 8px #0001', cursor: 'pointer' }}
                            onClick={() => { setIsModalOpen(true); setModalImageIdx(idx); }}
                  />
                  <button
                    type="button"
                            onClick={() => handleDeleteImage(idx)}
                    style={{
                      position: 'absolute',
                              top: 4,
                              right: 4,
                      background: '#fff',
                      border: '1px solid #ccc',
                      borderRadius: '50%',
                              width: 22,
                              height: 22,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 1px 4px #0002',
                      cursor: 'pointer',
                      zIndex: 2
                    }}
                    aria-label="이미지 삭제"
                  >
                    ×
                  </button>
                        </div>
                      ))}
                  {/* 확대 모달 */}
                  {isModalOpen && (
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
                        zIndex: 1000
                      }}
                      onClick={handleCloseModal}
                    >
                      <button
                        onClick={e => { e.stopPropagation(); setModalImageIdx(idx => Math.max(0, idx - 1)); }}
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
                          zIndex: 1001
                        }}
                      >&#8592;</button>
                      <img
                        src={imagePreviews[modalImageIdx]}
                        alt="확대 이미지"
                        style={{ maxWidth: '90vw', maxHeight: '80vh', borderRadius: 12, boxShadow: '0 4px 24px #0005' }}
                        onClick={e => e.stopPropagation()}
                      />
                      <button
                        onClick={e => { e.stopPropagation(); setModalImageIdx(idx => Math.min(imagePreviews.length - 1, idx + 1)); }}
                        disabled={modalImageIdx === imagePreviews.length - 1}
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
                          zIndex: 1001
                        }}
                      >&#8594;</button>
                    </div>
                  )}
                </div>
                  )}
                </>
              )}
              {/* PDF 업로드: 이미지가 선택되지 않은 경우에만 노출 */}
              {imagePreviews.length === 0 && !selectedPdf && (
                <>
                  <input
                    type="file"
                    accept="application/pdf"
                    onChange={handlePdfSelect}
                    id="pdf-input"
                    className="file-input"
                    style={{ marginTop: 16 }}
                    ref={pdfInputRef}
                  />
                  <label htmlFor="pdf-input" className="file-label" style={{ marginTop: 8 }}>
                    <div className="upload-placeholder">
                      <span>📄</span>
                      <p>PDF 파일 업로드</p>
                      <small>(PDF)</small>
                    </div>
                  </label>
                </>
              )}
              {/* PDF 미리보기 */}
              {selectedPdf && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: 16 }}>
                  <div style={{ width: 320, height: 420, overflow: 'auto', borderRadius: 8, boxShadow: '0 2px 8px #0001', background: '#fff' }}>
                    <Document
                      file={selectedPdf}
                      onLoadSuccess={({ numPages }) => setNumPages(numPages)}
                      onLoadError={console.error}
                      loading={<div>PDF 미리보기 로딩 중...</div>}
                    >
                      {Array.from({ length: numPages }, (_, i) => (
                        <Page key={i + 1} pageNumber={i + 1} width={320} />
                      ))}
                    </Document>
                  </div>
                  <span style={{ marginTop: 8, fontWeight: 600 }}>{pdfName}</span>
                </div>
              )}
            </div>
                      {/* 전체 삭제 버튼: 이미지나 PDF가 있을 때만 노출, 노트 정보 위에 위치 */}
            {(imagePreviews.length > 0 || pdfName) && (
              <div style={{ display: 'flex', justifyContent: 'center', margin: '24px 0 8px 0' }}>
                <button onClick={handleClearAll} style={{ background: '#f66', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 20px', fontWeight: 600, cursor: 'pointer', fontSize: 16 }}>
                  전체 삭제
                </button>
              </div>
            )}
          </div>



          <div className="upload-section">
            <h2> 기록 정보</h2>
            <div className="form-group">
              <label>분류 유형</label>
              <select
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="form-select"
              >
                <option value="">분류 유형을 선택하세요</option>
                {subjectOptions.map(subj => (
                  <option key={subj} value={subj}>{subj}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>태그</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="form-select"
              >
                <option value="">태그를 입력하세요</option>
                {semesterOptions.map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>해쉬 태그</label>
              <input
                type="text"
                value={keywords}
                onChange={(e) => setKeywords(e.target.value)}
                placeholder="#공부기록 #필사노트 #일상"
                className="form-input"
                maxLength={200}
              />
        
            </div>
            <div className="form-group">
              <label>이름</label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="K-intelligence 프로젝트 노트"
                className="form-input"
                maxLength={200}
              />
            </div>
            <div className="form-group">
              <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input
                  type="checkbox"
                  checked={isPublic}
                  onChange={e => setIsPublic(e.target.checked)}
                  style={{ width: 18, height: 18 }}
                />
                전체 서고에 공개하기
              </label>
              <small>체크하면 전체 서고에 기록됩니다, 다른 사람과 자신의 작업물을 공유해보세요 !</small>
            </div>
          </div>

          {/* 스낵바 */}
          <Snackbar
            message={snackbar.message}
            type={snackbar.type}
            open={snackbar.open}
            duration={snackbar.duration}
            onClose={() => setSnackbar(s => ({ ...s, open: false }))}
          />

          <button
            onClick={handleUpload}
            disabled={isUploading || (!selectedImages.length && !selectedPdf) || !keywords || !title || !category}
            className="upload-btn"
          >
            {isUploading ? '처리 중...' : '기록 보관중'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default Upload; 