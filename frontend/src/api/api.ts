import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8080/api',
});

// Interceptor para añadir el token a las peticiones
api.interceptors.request.use((config) => {
  const djData = localStorage.getItem('dj_user');
  if (djData) {
    const { access_token } = JSON.parse(djData);
    if (access_token) {
      config.headers.Authorization = `Bearer ${access_token}`;
    }
  }
  return config;
});

// Interceptor para manejar errores de autenticación
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && !window.location.pathname.includes('/dj/login')) {
      localStorage.removeItem('dj_user');
      window.location.href = '/dj/login';
    }
    return Promise.reject(error);
  }
);

export const catalog = {
  search: (q: string) => api.get(`/catalog/search?q=${encodeURIComponent(q)}`),
  getAll: () => api.get('/catalog/all'),
};

export const events = {
  create: (data: { name: string; venue: string; dj_id: number; template_id?: number; status?: string; event_date?: string }) => api.post('/events', data),
  delete: (id: number) => api.delete(`/events/${id}`),
  duplicate: (id: number) => api.post(`/events/${id}/duplicate`),
  launch: (id: number) => api.post(`/events/${id}/launch`),
  getOne: (id: number) => api.get(`/events/${id}`),
  getStats: (id: number) => api.get(`/events/${id}/stats`),
  close: (id: number) => api.post(`/events/${id}/close`),
  suspend: (id: number) => api.post(`/events/${id}/suspend`),
  update: (id: number, data: { name?: string; venue?: string; event_date?: string; status?: string }) => api.post(`/events/${id}/update`, data),
  toggleRecital: (id: number) => api.post(`/events/${id}/toggle-recital`),
  addSongs: (id: number, songs: { title: string; artist: string }[]) => api.post(`/events/${id}/songs`, { songs }),
  getTemplates: () => api.get('/event-templates'),
  setMaxVotes: (id: number, max: number) => api.post(`/events/${id}/max-votes`, { maxVotesPerDevice: max }),
  getSummary: (id: number) => api.get(`/events/${id}/summary`),
  getAnalytics: (id: number) => api.get(`/events/${id}/analytics`),
  getExport: (id: number) => api.get(`/events/${id}/export`),
  heartbeat: (id: number, deviceId: string) => api.post(`/events/${id}/heartbeat`, { device_id: deviceId }),
  getActiveDevices: (id: number) => api.get(`/events/${id}/active-devices`),
};




export const songs = {
  getByEvent: (eventId: number) => api.get(`/events/${eventId}/songs`),
  getPlayedSongs: (eventId: number) => api.get(`/events/${eventId}/played`),
  getRanking: (eventId: number) => api.get(`/events/${eventId}/ranking`),
  markAsPlayed: (id: number) => api.post(`/songs/${id}/played`),
  delete: (id: number) => api.delete(`/songs/${id}`),
  search: (q: string) => api.get(`/songs/search?q=${q}`),
};

export const votes = {
  create: (songId: number, deviceId: string) => api.post('/votes', { song_id: songId, device_id: deviceId }),
};

export const auth = {
  login: (email: string, password: string) => api.post('/auth/login', { email, password }),
  register: (email: string, password: string, name?: string) => api.post('/auth/register', { email, password, name }),
};

export const billing = {
  getStatus: () => api.get('/billing/status'),
  createCheckout: (plan: string) => api.post(`/billing/checkout/${plan}`),
  cancel: () => api.post('/billing/cancel'),
};

export default api;
