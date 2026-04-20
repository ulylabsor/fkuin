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

// Dosen Tetap
export const getDosenSarjana = () => api.get('/dosen-tetap');
export const getDosenSarjanaById = (id) => api.get(`/dosen-tetap/${id}`);
export const createDosenSarjana = (data) => api.post('/dosen-tetap', data);
export const updateDosenSarjana = (id, data) => api.put(`/dosen-tetap/${id}`, data);
export const deleteDosenSarjana = (id) => api.delete(`/dosen-tetap/${id}`);

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

// Dokumen
export const getDocuments = (sdmType, personnelId) => {
  if (personnelId === 'all') {
    return api.get(`/dokumen/${sdmType}/all/files`);
  }
  return api.get(`/dokumen/${sdmType}/${personnelId}`);
};
export const getDocumentsAdmin = (sdmType, personnelId) =>
  api.get(`/dokumen/${sdmType}/${personnelId}`);
export const getPhoto = (sdmType, personnelId) => api.get(`/dokumen/${sdmType}/${personnelId}/photo`);
export const getPublicPhoto = (sdmType, personnelId) => api.get(`/public/photo/${sdmType}/${personnelId}`);
export const getPublicDocumentKeys = (sdmType) => api.get(`/public/documents/${sdmType}`);
export const getPublicFileInfo = (sdmType) => api.get(`/public/file-info/${sdmType}`);

export const uploadDocument = (formData) => {
  // Create a new axios instance for uploads to avoid Content-Type issues
  const uploadApi = axios.create({
    baseURL: '/api'
  });

  // Add auth token
  const token = localStorage.getItem('token');
  if (token) {
    uploadApi.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }

  // Don't set Content-Type - let axios set multipart/form-data with boundary
  return uploadApi.post('/dokumen/upload', formData);
};

export const deleteDocument = (sdmType, personnelId, documentKey) =>
  api.delete(`/dokumen/${sdmType}/${personnelId}/${documentKey}`);

export const deleteAllDocuments = (sdmType, personnelId) =>
  api.delete(`/dokumen/${sdmType}/${personnelId}`);

export default api;
