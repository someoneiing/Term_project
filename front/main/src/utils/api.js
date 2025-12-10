import axios from 'axios';

// API 서버용 인스턴스
const API_BASE_URL = process.env.REACT_APP_API_URL;
const api = axios.create({
  baseURL: API_BASE_URL,
});

// AI 서버용 인스턴스
const AI_BASE_URL = process.env.REACT_APP_AI_URL;
const aiApi = axios.create({
  baseURL: AI_BASE_URL,
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export { api, aiApi }; 