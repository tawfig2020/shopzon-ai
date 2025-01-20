import axios from 'axios';

import { auth } from '../firebase';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor to include the Firebase token
api.interceptors.request.use(
  async (config) => {
    const user = auth.currentUser;
    if (user) {
      const token = await user.getIdToken();
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      // Handle specific error cases
      switch (error.response.status) {
        case 401:
          // Unauthorized - redirect to login
          window.location.href = '/login';
          break;
        case 403:
          // Forbidden - show error message
          console.error('Access denied');
          break;
        default:
          console.error('API Error:', error.response.data);
      }
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  getCurrentUser: async () => {
    const user = auth.currentUser;
    if (!user) return null;

    try {
      const response = await api.get('/users/profile');
      return response.data;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }
  },

  updateProfile: async (userData) => {
    const response = await api.put('/users/profile', userData);
    return response.data;
  },
};

export const listsAPI = {
  getLists: async () => {
    const response = await api.get('/lists');
    return response.data;
  },

  createList: async (listData) => {
    const response = await api.post('/lists', listData);
    return response.data;
  },

  updateList: async (listId, listData) => {
    const response = await api.put(`/lists/${listId}`, listData);
    return response.data;
  },

  deleteList: async (listId) => {
    await api.delete(`/lists/${listId}`);
  },
};

export default api;
