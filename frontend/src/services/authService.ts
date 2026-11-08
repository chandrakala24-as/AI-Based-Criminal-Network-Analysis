import { api } from './api';
import { User } from '../types';

export const authService = {
  async login(username: string, password: string) {
    const res = await api.post('/auth/login', { username, password });
    if (res.data.access_token) {
      localStorage.setItem('crimegraph_token', res.data.access_token);
      localStorage.setItem('crimegraph_user', JSON.stringify(res.data.user));
    }
    return res.data;
  },

  async register(data: { username: string; email: string; password: string; role?: string }) {
    const res = await api.post('/auth/register', data);
    return res.data;
  },

  async getMe(): Promise<User> {
    const res = await api.get('/auth/me');
    return res.data;
  },

  logout() {
    localStorage.removeItem('crimegraph_token');
    localStorage.removeItem('crimegraph_user');
  },

  getCurrentUser(): User | null {
    const userStr = localStorage.getItem('crimegraph_user');
    if (!userStr) return null;
    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  }
};
