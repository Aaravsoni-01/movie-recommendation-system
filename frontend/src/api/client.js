import axios from 'axios';

const client = axios.create({
  baseURL: 'http://localhost:8000',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor — attach JWT token
client.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor — handle 401
client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      // Only redirect if not already on login/register
      const path = window.location.pathname;
      if (path !== '/login' && path !== '/register') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// ─── Auth ────────────────────────────────────────
export const login = async (username, password) => {
  const formData = new URLSearchParams();
  formData.append('username', username);
  formData.append('password', password);
  const { data } = await client.post('/auth/login', formData, {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  });
  return data;
};

export const register = async (username, email, password) => {
  const { data } = await client.post('/auth/register', { username, email, password });
  return data;
};

export const getMe = async () => {
  const { data } = await client.get('/auth/me');
  return data;
};

// ─── Movies ──────────────────────────────────────
export const getMovies = async (params = {}) => {
  const { data } = await client.get('/movies', { params });
  return data;
};

export const searchMovies = async (query) => {
  const { data } = await client.get('/movies/search', { params: { q: query } });
  return data;
};

export const getTrendingMovies = async () => {
  const { data } = await client.get('/movies/trending');
  return data;
};

export const getGenres = async () => {
  const { data } = await client.get('/movies/genres');
  return data;
};

export const getMovie = async (id) => {
  const { data } = await client.get(`/movies/${id}`);
  return data;
};

export const fetchFromOmdb = async (title) => {
  const { data } = await client.post('/movies/fetch-omdb', { title });
  return data;
};

// ─── Tier Lists ──────────────────────────────────
export const getTierLists = async () => {
  const { data } = await client.get('/tiers');
  return data;
};

export const createTierList = async (name) => {
  const { data } = await client.post('/tiers', { name });
  return data;
};

export const getTierList = async (id) => {
  const { data } = await client.get(`/tiers/${id}`);
  return data;
};

export const addTierItem = async (listId, movieId, tier) => {
  const { data } = await client.post(`/tiers/${listId}/items`, { movie_id: movieId, tier });
  return data;
};

export const updateTierItem = async (listId, itemId, updateData) => {
  const { data } = await client.put(`/tiers/${listId}/items/${itemId}`, updateData);
  return data;
};

export const removeTierItem = async (listId, itemId) => {
  const { data } = await client.delete(`/tiers/${listId}/items/${itemId}`);
  return data;
};

// ─── Studios ─────────────────────────────────────
export const getStudios = async () => {
  const { data } = await client.get('/studios');
  return data;
};

export const getStudio = async (name) => {
  const { data } = await client.get(`/studios/${encodeURIComponent(name)}`);
  return data;
};

export const getStudioMovies = async (name) => {
  const { data } = await client.get(`/studios/${encodeURIComponent(name)}/movies`);
  return data;
};

export const getStudioTimeline = async (name) => {
  const { data } = await client.get(`/studios/${encodeURIComponent(name)}/timeline`);
  return data;
};

// ─── Recommendations ─────────────────────────────
export const getRecommendations = async () => {
  const { data } = await client.get('/recommendations');
  return data;
};

export const getSimilarMovies = async (id) => {
  const { data } = await client.get(`/recommendations/similar/${id}`);
  return data;
};

export const getMoodRecommendations = async (mood) => {
  const { data } = await client.post('/recommendations/mood', { mood });
  return data;
};

export const getWatchNext = async () => {
  const { data } = await client.get('/recommendations/watch-next');
  return data;
};

// ─── Analytics ───────────────────────────────────
export const getDashboard = async () => {
  const { data } = await client.get('/analytics/dashboard');
  return data;
};

export const getHistory = async () => {
  const { data } = await client.get('/analytics/history');
  return data;
};

export default client;
