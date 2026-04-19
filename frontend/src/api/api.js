import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('admin');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth
export const login = (username, password) => api.post('/auth/login', { username, password });
export const logout = () => api.post('/auth/logout');
export const getMe = () => api.get('/auth/me');

// Dosen Sarjana
export const getDosenSarjana = () => api.get('/dosen-sarjana');
export const getDosenSarjanaById = (id) => api.get(`/dosen-sarjana/${id}`);
export const createDosenSarjana = (data) => api.post('/dosen-sarjana', data);
export const updateDosenSarjana = (id, data) => api.put(`/dosen-sarjana/${id}`, data);
export const deleteDosenSarjana = (id) => api.delete(`/dosen-sarjana/${id}`);

// Pembimbing Klinik
export const getPembimbingKlinik = () => api.get('/pembimbing-klinik');
export const getPembimbingKlinikById = (id) => api.get(`/pembimbing-klinik/${id}`);
export const createPembimbingKlinik = (data) => api.post('/pembimbing-klinik', data);
export const updatePembimbingKlinik = (id, data) => api.put(`/pembimbing-klinik/${id}`, data);
export const deletePembimbingKlinik = (id) => api.delete(`/pembimbing-klinik/${id}`);

// Tendik
export const getTendik = () => api.get('/tendik');
export const getTendikById = (id) => api.get(`/tendik/${id}`);
export const createTendik = (data) => api.post('/tendik', data);
export const updateTendik = (id, data) => api.put(`/tendik/${id}`, data);
export const deleteTendik = (id) => api.delete(`/tendik/${id}`);

// Stats
export const getStats = () => api.get('/stats');

export default api;
