import axios from 'axios';
import { auth } from './firebase';

const API_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use(async (config) => {
  try {
    const user = auth?.currentUser;
    if (user && typeof user.getIdToken === 'function') {
      const token = await user.getIdToken();
      config.headers.Authorization = `Bearer ${token}`;
    } else {
      config.headers.Authorization = `Bearer mock-token-dev`;
    }
  } catch (err) {
    config.headers.Authorization = `Bearer mock-token-dev`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error.response?.data?.message || error.message || 'An unexpected error occurred';
    return Promise.reject(new Error(message));
  }
);

export const boardAPI = {
  create: (title) => api.post('/boards', { title }),
  getAll: () => api.get('/boards'),
  getById: (id) => api.get(`/boards/${id}`),
  update: (id, data) => api.put(`/boards/${id}`, data),
  delete: (id) => api.delete(`/boards/${id}`),
};

export const aiAPI = {
  generate: (prompt) => api.post('/ai/generate', { prompt }),
  generateDiagramWithKroki: (prompt) => api.post('/ai/generate-diagram', { prompt }),
  modify: (prompt, currentDiagram) => api.post('/ai/modify', { prompt, currentDiagram }),
};

export default api;
