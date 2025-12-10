// JWT 토큰 관리 유틸리티

export const getToken = () => {
  return localStorage.getItem('token');
};

export const setToken = (token) => {
  localStorage.setItem('token', token);
};

export const removeToken = () => {
  localStorage.removeItem('token');
};

export const getUsername = () => {
  return localStorage.getItem('username');
};

export const setUsername = (username) => {
  localStorage.setItem('username', username);
};

export const removeUsername = () => {
  localStorage.removeItem('username');
};

export const isLoggedIn = () => {
  const token = getToken();
  const username = getUsername();
  return !!(token && username);
};

export const logout = () => {
  localStorage.clear();
  console.log('User logged out - localStorage cleared');
};

// JWT 토큰 디코딩 (페이로드만)
export const decodeToken = (token) => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Token decode error:', error);
    return null;
  }
};

// 토큰 만료 확인
export const isTokenExpired = (token) => {
  const decoded = decodeToken(token);
  if (!decoded || !decoded.exp) return true;
  
  const currentTime = Date.now() / 1000;
  return decoded.exp < currentTime;
};

// 유효한 토큰인지 확인
export const isValidToken = () => {
  const token = getToken();
  if (!token) return false;
  
  if (isTokenExpired(token)) {
    logout();
    return false;
  }
  
  return true;
}; 