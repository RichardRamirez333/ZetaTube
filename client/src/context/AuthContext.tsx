import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { IUser } from '../types';
import api from '../api/axios';

interface AuthContextType {
  user: IUser | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (username: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  updateUser: (user: IUser) => void;
  updateProfile: (data: FormData | Record<string, any>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>(null!);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<IUser | null>(() => {
    const stored = localStorage.getItem('user');
    return stored ? JSON.parse(stored) : null;
  });

  useEffect(() => {
    if (user?.token) {
      api.get('/auth/me').then((res) => {
        setUser((prev) => prev ? { ...res.data, token: prev.token } : null);
      }).catch(() => {
        setUser(null);
        localStorage.removeItem('user');
      });
    }
  }, []);

  const login = async (email: string, password: string) => {
    const { data } = await api.post('/auth/login', { email, password });
    setUser(data);
    localStorage.setItem('user', JSON.stringify(data));
  };

  const signup = async (username: string, email: string, password: string) => {
    const { data } = await api.post('/auth/signup', { username, email, password });
    setUser(data);
    localStorage.setItem('user', JSON.stringify(data));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
  };

  const updateUser = (updated: IUser) => {
    setUser(updated);
    localStorage.setItem('user', JSON.stringify(updated));
  };

  const updateProfile = async (data: FormData | Record<string, any>) => {
    const res = await api.put('/auth/profile', data, data instanceof FormData ? {
      headers: { 'Content-Type': 'multipart/form-data' },
    } : {});
    setUser(res.data);
    localStorage.setItem('user', JSON.stringify(res.data));
  };

  return (
    <AuthContext.Provider value={{ user, login, signup, logout, updateUser, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
