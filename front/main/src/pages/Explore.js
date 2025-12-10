import React, { useState, useEffect } from 'react';
import { api } from '../utils/api';
import { useNavigate } from 'react-router-dom';
import './Notes.css';

function Explore() {
  const [notes, setNotes] = useState([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('전체');
  const [categories, setCategories] = useState(['전체']);
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/api/notes/public').then(res => {
      setNotes(res.data);
      // 과목명(타이틀) 기준으로 카테고리 생성
      const cats = Array.from(new Set(res.data.map(note => note.title)));
      setCategories(['전체', ...cats]);
    });
  }, []);

  const filteredNotes = notes.filter(note => {
    const keywordMatch = search === '' || (note.keywords && note.keywords.some(k => k.includes(search)));
    const categoryMatch = category === '전체' || note.title === category;
    return keywordMatch && categoryMatch;
  });

  const handleShowDetail = (note) => navigate(`/notes/${note.id}`);
  const handleQuiz = (note) => navigate(`/notes/${note.id}/quiz`);

  return (
    <div className="notes">
      <div className="notes-header">
        <h1>규장각 아카이브</h1>
        <p>다른 사용자가 보관한 서고를 탐색해보세요</p>
        <div style={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          gap: 0,
          marginTop: 16,
          width: '100%',
          maxWidth: 700,
          marginLeft: 'auto',
          marginRight: 'auto',
          background: '#f8f9fa',
          borderRadius: 12,
          boxShadow: '0 10px 8px #0001',
          padding: '0 16px',
          height: 56
        }}>
          <select
            value={category}
            onChange={e => setCategory(e.target.value)}
            style={{
              flex: '0 0 200px',
              height: 40,
              border: 'none',
              borderRadius: 8,
              fontSize: '1rem',
              marginRight: 12,
              background: '#fff',
              boxShadow: '0 1px 4px #0001',
              padding: '0 16px',
              fontWeight: 600
            }}
          >
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="키워드 입력"
            style={{
              flex: 1,
              height: 40,
              border: 'none',
              borderRadius: 8,
              fontSize: '1rem',
              background: '#fff',
              boxShadow: '0 1px 4px #0001',
              padding: '0 16px',
              fontWeight: 500
            }}
          />
        </div>
      </div>
      <div className="notes-content">
        {filteredNotes.length === 0 ? (
          <div className="no-notes" style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',minHeight:'40vh',fontSize:'1.1rem',color:'#888'}}>
            <p>🔍 조건에 맞는 서고가 없습니다.</p>
          </div>
        ) : (
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
                  <span className="note-author" style={{marginLeft:12}}>
                    작성자: {note.userName || '익명'}
                  </span>
                  <div className="note-actions">
                    <button className="action-btn quiz-btn" onClick={() => handleQuiz(note)}>퀴즈</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Explore;
