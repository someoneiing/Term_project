import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../utils/api';
// import './NoteDetail.css';
import './NoteEdit.css';

function getFullUrl(url) {
  if (!url) return '';
  if (url.startsWith('http')) return url;
  return process.env.REACT_APP_API_URL + url;
}

function removeMarkdownCodeBlocks(text) {
  if (!text) return '';
  return text
    .replace(/^```markdown\s*/, '')
    .replace(/^```\s*/, '')
    .replace(/\s*```$/, '')
    .trim();
}

const SEMESTERS = [
  '학교', '직장', '여가', '작업물','기타'
];

// 기존 CS_SUBJECTS 삭제, 아래 subjectOptions로 대체
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

function NoteEdit() {
  const { noteId } = useParams();
  const [note, setNote] = useState(null);
  const [allTitles, setAllTitles] = useState([]);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [keywords, setKeywords] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [publicState, setPublicState] = useState(false);

  // Load note detail and all titles for dropdown
  useEffect(() => {
    let userId = localStorage.getItem('userId');
    Promise.all([
      api.get(`/api/notes/${noteId}`),
      userId ? api.get(`/api/notes/user/${userId}`) : Promise.resolve({data: []})
    ]).then(([noteRes, notesRes]) => {
      console.log('noteRes', noteRes.data);
      setNote(noteRes.data);
      setTitle(noteRes.data.title || '분류 유형');
      setCategory(noteRes.data.category || '태그');
      setDescription(noteRes.data.description || '');
      setKeywords(noteRes.data.keywords ? noteRes.data.keywords.join(', ') : '');
      setContent(noteRes.data.content || '');
      setPublicState(noteRes.data.public || false);
      // unique titles for dropdown
      const titles = Array.from(new Set((notesRes.data || []).map(n => n.title).filter(Boolean)));
      setAllTitles(titles);
      setLoading(false);
      // 접근 권한 체크
      if (String(noteRes.data.userId) !== String(userId)) {
        alert('수정 권한이 없습니다.');
        navigate('/dashboard');
      }
    });
  }, [noteId]);
  // note가 바뀔 때마다 publicState 동기화
  useEffect(() => {
    console.log('note', note);
    if (note) {
      setPublicState(note.public);
    }
  }, [note]);

  // 키워드 5개 제한
  const handleKeywordsChange = (e) => {
    let arr = e.target.value.split(',').map(k => k.trim()).filter(k => k.length > 0);
    if (arr.length > 5) arr = arr.slice(0, 5);
    setKeywords(arr.join(', '));
  };

  if (loading) return <div style={{padding:40}}>로딩 중...</div>;
  if (!note) return <div style={{padding:40}}>노트를 찾을 수 없습니다.</div>;

  // 필수값 체크
  const isSaveDisabled =
    !title || title === '유형 선택' ||
    !category || category === '태그 선택' ||
    !description.trim() ||
    !content.trim();

  // 수정완료
  const handleSave = async () => {
    // PATCH: 빈 값이면 기존 값 사용
    const keywordsArray = keywords
      .split(',')
      .map(k => k.trim())
      .filter(k => k.length > 0)
      .slice(0, 5);
    const patchData = {
      title: title || note.title,
      category: category || note.category,
      keywords: keywordsArray.length > 0 ? keywordsArray : note.keywords,
      description: description || note.description,
      content: content || note.content,
      public: publicState
    };
    await api.patch(`/api/notes/${noteId}`, patchData);
    // 카테고리 쿼리스트링 유지하며 상세로 이동
    const cat = searchParams.get('category');
    navigate(`/notes/${noteId}` + (cat ? `?category=${encodeURIComponent(cat)}` : ''));
  };

  // 수정취소
  const handleCancel = () => {
    const cat = searchParams.get('category');
    navigate(`/notes/${noteId}` + (cat ? `?category=${encodeURIComponent(cat)}` : ''));
  };

  return (
    <>
      <div className="note-edit-wrapper">
        <div className="note-edit-container">
          <h1 className="note-title">서고 수정 : {note.title}</h1>
          {/* 과목명 드롭다운 */}
          <div style={{marginBottom: 20}}>
            <label style={{display: 'block', marginBottom: 8, fontWeight: 600, color: '#333'}}>
              분류 유형 :
            </label>
            <select
              value={title}
              onChange={e => setTitle(e.target.value)}
              style={{width: '100%', boxSizing: 'border-box', padding: '12px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '1rem'}}
            >
              <option value="과목명 선택">분류 유형을 선택하세요</option>
              {subjectOptions.map((t, i) => (
                <option key={i} value={t}>{t}</option>
              ))}
            </select>
          </div>
          {/* 학기 드롭다운 */}
          <div style={{marginBottom: 20}}>
            <label style={{display: 'block', marginBottom: 8, fontWeight: 600, color: '#333'}}>
              태그 :
            </label>
            <select
              value={category}
              onChange={e => setCategory(e.target.value)}
              style={{width: '100%', boxSizing: 'border-box', padding: '12px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '1rem'}}
            >
              <option value="학기 선택">태그를 입력하세요</option>
              {SEMESTERS.map((sem, i) => (
                <option key={i} value={sem}>{sem}</option>
              ))}
            </select>
          </div>
          {/* 키워드 */}
          <div style={{marginBottom: 20}}>
            <label style={{display: 'block', marginBottom: 8, fontWeight: 600, color: '#333'}}>
              해쉬 태그 :
            </label>
            <input
              type="text"
              value={keywords}
              onChange={e => {
                const value = e.target.value;
                const commaCount = (value.match(/,/g) || []).length;
                if (commaCount <= 4) {
                  setKeywords(value);
                }
              }}
              placeholder="키워드1, 키워드2, ..."
              style={{width: '100%', boxSizing: 'border-box', padding: '12px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '1rem'}} 
              maxLength={200}
            />
          </div>
          {/* 설명 */}
          <div style={{marginBottom: 20}}>
            <label style={{display: 'block', marginBottom: 8, fontWeight: 600, color: '#333'}}>
              이름 :
            </label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={3}
              placeholder="노트에 대한 간단한 설명을 입력하세요"
              style={{width: '100%', boxSizing: 'border-box', padding: '12px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '1rem', resize: 'vertical'}} 
              maxLength={200}
            />
          </div>
          {/* 내용 */}
          <div style={{marginBottom: 20}}>
            <label style={{display: 'block', marginBottom: 8, fontWeight: 600, color: '#333'}}>
              내용 :
            </label>
            <textarea
              value={content}
              onChange={e => setContent(e.target.value)}
              rows={18}
              placeholder="노트 내용을 입력하세요"
              style={{width: '100%', minWidth: 260, maxWidth: 700, boxSizing: 'border-box', padding: '12px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '1rem', resize: 'vertical', lineHeight: '1.6'}}
            />
          </div>
          {/* 공개/비공개 스위치 */}
          <div style={{marginBottom: 24}}>
            <div style={{ display: 'flex', alignItems: 'left', gap: 12}}>
              <label htmlFor="isPublicCheckbox" style={{ flex: 'none', fontWeight: 600, margin: 0, cursor: 'pointer', userSelect: 'none'}}>
                전체 공개(마켓/탐색 허용)
              </label>
              <input
                id="isPublicCheckbox"
                type="checkbox"
                checked={publicState}
                onChange={e => setPublicState(e.target.checked)}
                style={{
                  width: 18,
                  height: 18,
                  cursor: 'pointer',
                  userSelect: 'none',
                  flex: 'none',
                  margin: 0,
                }}
              />
            </div>
            <small style={{marginLeft: 2}}>체크하면 모든 사용자가 이 노트를 탐색/열람할 수 있습니다.</small>
          </div>
          <div className="note-edit-actions">
            <button 
              className="modal-complete-btn" 
              onClick={handleSave}
              style={{flex: 1, minWidth: 0, padding: '16px 0', fontSize: '1.1rem', borderRadius: '8px'}}
              disabled={isSaveDisabled}
            >수정완료</button>
            <button 
              className="modal-incomplete-btn" 
              onClick={handleCancel}
              style={{flex: 1, minWidth: 0, padding: '16px 0', fontSize: '1.1rem', borderRadius: '8px'}}
            >수정취소</button>
          </div>
        </div>
      </div>
    </>
  );
}

export default NoteEdit; 