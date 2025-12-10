import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { setToken, setUsername } from '../utils/auth';
import { api } from '../utils/api';

function Login() {
  const [formData, setFormData] = useState({
    username: '',
    password: ''
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

    try {
      const response = await api.post('/api/auth/login', {
        username: formData.username,
        password: formData.password
      });

      if (response.data.success) {
        setMessage('로그인이 완료되었습니다! 메인 페이지로 이동합니다.');
        
        // JWT 토큰 저장
        setToken(response.data.token);
        setUsername(response.data.username);
        localStorage.setItem('userId', response.data.userId); // userId 저장
        
        // 저장 확인 로그
        console.log('JWT Token saved:', response.data.token ? 'Yes' : 'No');
        console.log('Username saved:', response.data.username);
        console.log('UserId saved:', response.data.userId);
        console.log('LocalStorage token:', localStorage.getItem('token'));
        
        navigate('/dashboard');
      } else {
        setMessage(response.data.message);
      }
    } catch (error) {
      if (error.response) {
        setMessage(error.response.data.message || '로그인 중 오류가 발생했습니다.');
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
        <h2 className="form-title">로그인</h2>
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
            />
          </div>
          <button 
            type="submit" 
            className="form-button"
            disabled={isLoading}
          >
            {isLoading ? '로그인 중...' : '로그인'}
          </button>
        </form>
        <div className="form-link">
          계정이 없으신가요? <Link to="/signup">회원가입하기</Link>
        </div>
      </div>
    </div>
  );
}

export default Login; 