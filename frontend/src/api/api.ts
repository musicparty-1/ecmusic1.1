import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  withCredentials: true, // envía cookies httpOnly automáticamente
  headers: {
    'ngrok-skip-browser-warning': 'true',
  },
});

// Interceptor de request: agrega Bearer solo si hay token (mobile / backward compat)
api.interceptors.request.use((config) => {
  const djData = localStorage.getItem('dj_user');
  if (djData) {
    try {
      const parsed = JSON.parse(djData);
      // Solo agrega el header si hay token explícito (mobile fallback)
      if (parsed?.access_token) {
        config.headers.Authorization = `Bearer ${parsed.access_token}`;
      }
    } catch {
      // ignore
    }
  }
  return config;
});

let isRefreshing = false;
let failedQueue: Array<{ resolve: (v: any) => void; reject: (e: any) => void }> = [];

function processQueue(error: any, token: string | null = null) {
  failedQueue.forEach((p) => (error ? p.reject(error) : p.resolve(token)));
  failedQueue = [];
}

// Interceptor de response: intenta refresh en 401 antes de redirigir al login
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      const path = window.location.pathname;
      const isDJRoute = path.startsWith('/dj/') &&
        !path.startsWith('/dj/login') &&
        !path.startsWith('/dj/register');

      if (!isDJRoute) return Promise.reject(error);

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(() => api(originalRequest));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        await axios.post('/api/auth/refresh', {}, { withCredentials: true });
        processQueue(null);
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError);
        localStorage.removeItem('dj_user');
        window.location.href = '/dj/login';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }
    return Promise.reject(error);
  }
);

export const catalog = {
  search: (q: string, genre?: string) => api.get(`/catalog/search?q=${encodeURIComponent(q)}${genre ? `&genre=${encodeURIComponent(genre)}` : ''}`),
  getAll: (genre?: string) => api.get(`/catalog/all${genre ? `?genre=${encodeURIComponent(genre)}` : ''}`),
  getGenres: () => api.get('/catalog/genres'),
};

export const events = {
  create: (data: { name: string; venue: string; dj_id: number; template_id?: number; startDate?: string }) => api.post('/events', data),
  delete: (id: number) => api.delete(`/events/${id}`),
  duplicate: (id: number) => api.post(`/events/${id}/duplicate`),
  launch: (id: number) => api.post(`/events/${id}/launch`),
  getOne: (id: number) => api.get(`/events/${id}`),
  getStats: (id: number) => api.get(`/events/${id}/stats`),
  close: (id: number) => api.post(`/events/${id}/close`),
  suspend: (id: number) => api.post(`/events/${id}/suspend`),
  toggleRecital: (id: number) => api.post(`/events/${id}/toggle-recital`),
  addSongs: (id: number, songs: { title: string; artist: string }[]) => api.post(`/events/${id}/songs`, { songs }),
  getTemplates: () => api.get('/event-templates'),
  setMaxVotes: (id: number, max: number) => api.post(`/events/${id}/max-votes`, { maxVotesPerDevice: max }),
  getSummary: (id: number) => api.get(`/events/${id}/summary`),
  getAnalytics: (id: number) => api.get(`/events/${id}/analytics`),
  getExport: (id: number) => api.get(`/events/${id}/export`),
  heartbeat: (id: number, deviceId: string) => api.post(`/events/${id}/heartbeat`, { device_id: deviceId }),
  getActiveDevices: (id: number) => api.get(`/events/${id}/active-devices`),
  update: (id: number, data: any) => api.put(`/events/${id}`, data),
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
  logout: () => api.post('/auth/logout'),
  refresh: () => api.post('/auth/refresh'),
};

export const billing = {
  getStatus: () => api.get('/billing/status'),
  createCheckout: (plan: string) => api.post(`/billing/checkout/${plan}`),
  cancel: () => api.post('/billing/cancel'),
  buyCredits: (pack: 'SINGLE' | 'PACK3' | 'PACK10') => api.post(`/billing/buy-credits/${pack}`),
};

export default api;
