import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || '/api';
const UPLOAD_BASE = API_BASE.replace('/api', '');

const uploadPrefix = (path: string) => {
  if (!path || path.startsWith('http') || path.startsWith('data:')) return path;
  if (path.startsWith('/uploads/')) return `${UPLOAD_BASE}${path}`;
  return path;
};

const deepFixUploads = (obj: any): any => {
  if (typeof obj === 'string') return uploadPrefix(obj);
  if (Array.isArray(obj)) return obj.map(deepFixUploads);
  if (obj && typeof obj === 'object') {
    const fixed: any = {};
    for (const [k, v] of Object.entries(obj)) {
      fixed[k] = deepFixUploads(v);
    }
    return fixed;
  }
  return obj;
};

const api = axios.create({ baseURL: API_BASE });

api.interceptors.response.use((res) => {
  res.data = deepFixUploads(res.data);
  return res;
});

api.interceptors.request.use((config) => {
  const user = localStorage.getItem('user');
  if (user) {
    const { token } = JSON.parse(user);
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
