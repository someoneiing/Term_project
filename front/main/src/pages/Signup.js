import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { setToken, setUsername } from '../utils/auth';
import { api } from '../utils/api';

function Signup() {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setIsLoading(true);

    // 비밀번호 확인
    if (formData.password !== formData.confirmPassword) {
      setMessage('비밀번호가 일치하지 않습니다.');
      setIsLoading(false);
      return;
    }

    try {
      const response = await api.post('/api/auth/signup', {
        username: formData.username,
        email: formData.email,
        password: formData.password
      });

      if (response.data.success) {
        setMessage('회원가입이 완료되었습니다! 로그인 페이지로 이동합니다.');
        
        // JWT 토큰 저장
        setToken(response.data.token);
        setUsername(response.data.username);
        
        // 저장 확인 로그
        console.log('JWT Token saved:', response.data.token ? 'Yes' : 'No');
        console.log('Username saved:', response.data.username);
        console.log('LocalStorage token:', localStorage.getItem('token'));
        
        setTimeout(() => {
          navigate('/login');
        }, 1000);
      } else {
        setMessage(response.data.message);
      }
    } catch (error) {
      if (error.response) {
        setMessage(error.response.data.message || '회원가입 중 오류가 발생했습니다.');
      } else {
        setMessage('서버에 연결할 수 없습니다.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-center-wrapper">
      <div className="form-container">
        <h2 className="form-title">회원가입</h2>
        {message && (
          <div className={message.includes('완료') ? 'success-message' : 'error-message'}>
            {message}
          </div>
        )}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">사용자명</label>
            <input
              type="text"
              name="username"
              className="form-input"
              value={formData.username}
              onChange={handleChange}
              required
              minLength="3"
              maxLength="20"
            />
          </div>
          <div className="form-group">
            <label className="form-label">이메일</label>
            <input
              type="email"
              name="email"
              className="form-input"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">비밀번호</label>
            <input
              type="password"
              name="password"
              className="form-input"
              value={formData.password}
              onChange={handleChange}
              required
              minLength="6"
            />
          </div>
          <div className="form-group">
            <label className="form-label">비밀번호 확인</label>
            <input
              type="password"
              name="confirmPassword"
              className="form-input"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              minLength="6"
            />
          </div>
          <button 
            type="submit" 
            className="form-button"
            disabled={isLoading}
          >
            {isLoading ? '처리 중...' : '회원가입'}
          </button>
        </form>
        <div className="form-link">
          이미 계정이 있으신가요? <Link to="/login">로그인하기</Link>
        </div>
      </div>
    </div>
  );
}

export default Signup; 