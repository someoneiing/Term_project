import React, { useState, useEffect } from 'react';
import { api } from '../utils/api';
import { useNavigate, useSearchParams } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import './Notes.css';

function Notes() {
  const [notes, setNotes] = useState([]);
  const [categories, setCategories] = useState(['전체']);
  const [detailNote, setDetailNote] = useState(null);
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || '전체');
  const [previewUrl, setPreviewUrl] = useState(null); // 이미지 미리보기 URL

  useEffect(() => {
    const userId = localStorage.getItem('userId');
    if (!userId) return;
    api.get(`/api/notes/user/${userId}`)
      .then(res => {
        setNotes(res.data);
        const cats = Array.from(new Set(res.data.map(note => note.title)));
        setCategories(['전체', ...cats]);
      });
  }, []);

  // Sync selectedCategory with URL changes (back/forward)
  useEffect(() => {
    const urlCat = searchParams.get('category') || '전체';
    setSelectedCategory(urlCat);
  }, [searchParams]);

  const filteredNotes = selectedCategory === '전체'
    ? notes
    : notes.filter(note => note.title === selectedCategory);

  // 상세 모달 열기 -> 페이지 이동
  const handleShowDetail = (note) => navigate(`/notes/${note.id}`);

  // 수정 페이지로 이동
  const handleEdit = (note) => {
    const cat = searchParams.get('category');
    navigate(`/notes/${note.id}/edit` + (cat ? `?category=${encodeURIComponent(cat)}` : ''));
  };

  // 삭제
  const handleDelete = async (noteId) => {
    if (!window.confirm('정말 삭제하시겠습니까?')) return;
    await api.delete(`/api/notes/${noteId}`);
    setNotes(notes.filter(n => n.id !== noteId));
  };

  // 퀴즈 이동
  const handleQuiz = (note) => {
    navigate(`/notes/${note.id}/quiz`);
  };

  // 카테고리 변경 시 URL 쿼리스트링도 변경
  const handleCategoryChange = (cat) => {
    setSelectedCategory(cat);
    setSearchParams(cat === '전체' ? {} : { category: cat });
  };

  return (
    <div className="notes">
      <div className="notes-header">
        <h1>나의 서고</h1>
        <p>보관한 서고들을 정리하고 관리해요</p>
      </div>

      <div className="notes-content">
        <div className="notes-filters">
          <div className="category-filter">
            <label>카테고리:</label>
            <select
              value={selectedCategory}
              onChange={e => handleCategoryChange(e.target.value)}
              className="category-select"
            >
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
          <div className="notes-count">
            총 {filteredNotes.length}개의 서고
          </div>
        </div>
        {/* 전체 보기: 기존 그리드 유지, 카테고리 선택 시 1xn 리스트 */}
        {selectedCategory === '전체' ? (
          <div className="notes-grid">
            {filteredNotes.map(note => (
              <div key={note.id} className="note-card">
                <div className="note-header">
                  <h3 style={{cursor:'pointer', textAlign:'left'}} onClick={() => handleShowDetail(note)}>{note.title}</h3>
                  <span className="note-category">{note.category}</span>
                </div>
                <div className="note-content">
                  <p className="note-summary">{note.description || ' '}</p>
                  <div className="note-keywords">
                    {note.keywords && note.keywords.map((keyword, idx) => (
                      <span key={idx} className="keyword">#{keyword}</span>
                    ))}
                  </div>
                </div>
                <div className="note-footer">
                  <span className="upload-date">
                    업로드: {note.createdAt?.slice(0, 10)}
                  </span>
                  <div className="note-actions">
                    <button className="action-btn quiz-btn" onClick={() => handleQuiz(note)}>퀴즈</button>
                    <button className="action-btn edit-btn" onClick={() => handleEdit(note)}>수정</button>
                    <button className="action-btn delete-btn" onClick={() => handleDelete(note.id)}>삭제</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) :
          <div className="notes-list-vertical">
            <div className="notes-list-header" style={{display:'flex',fontWeight:600,padding:'8px 0',borderBottom:'1px solid #eee',marginBottom:8}}>
              <div style={{flex:2}}>타이틀</div>
              <div style={{flex:2}}>키워드</div>
              <div style={{flex:3}}>간략한 설명</div>
              <div style={{flex:1}}>업로드 날짜</div>
              <div style={{flex:'0 0 220px',textAlign:'center'}}>액션</div>
            </div>
            {filteredNotes.map(note => (
              <div key={note.id} className="note-list-row" style={{display:'flex',alignItems:'center',padding:'10px 0',borderBottom:'1px solid #f2f2f2'}}>
                <div style={{flex:2}}>
                  <span style={{cursor:'pointer', textAlign:'left'}} onClick={() => handleShowDetail(note)}>{note.title}</span>
                </div>
                <div style={{flex:2}}>
                  {note.keywords && note.keywords.slice(0,5).map((keyword, idx) => (
                    <span key={idx} className="keyword">#{keyword} </span>
                  ))}
                </div>
                <div style={{flex:3}}>{note.description || ' '}</div>
                <div style={{flex:1}}>{note.createdAt?.slice(0, 10)}</div>
                <div style={{flex:'0 0 220px',textAlign:'center'}}>
                  <button className="action-btn edit-btn" style={{marginRight:8}} onClick={() => handleEdit(note)}>수정</button>
                  <button className="action-btn quiz-btn" style={{marginRight:8}} onClick={() => handleQuiz(note)}>퀴즈</button>
                  <button className="action-btn delete-btn" onClick={() => handleDelete(note.id)}>삭제</button>
                </div>
              </div>
            ))}
          </div>
        }
      </div>
      {filteredNotes.length === 0 ? (
              <div className="no-notes">
                <p>📝 아직 규장각에 보관된 기록이 없어요,</p>
                <p>첫 번째 기록을 보관해보세요!</p>
              </div>
            ) : (
              <div></div>
        )}
    </div>
  );
}

export default Notes; 