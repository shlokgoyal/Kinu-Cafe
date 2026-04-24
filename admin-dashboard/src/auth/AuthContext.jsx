import { createContext, useContext, useEffect, useState } from 'react';
import { authApi } from '../api/endpoints';
import { setUnauthorizedHandler } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadMe = async () => {
    try {
      const token = localStorage.getItem('kc_token');
      if (!token) { setUser(null); return; }
      const { user } = await authApi.me();
      setUser(user);
    } catch {
      localStorage.removeItem('kc_token');
      setUser(null);
    }
  };

  useEffect(() => {
    setUnauthorizedHandler(() => {
      localStorage.removeItem('kc_token');
      setUser(null);
    });
    loadMe().finally(() => setLoading(false));
  }, []);

  const login = async (email, password) => {
    const { token, user } = await authApi.login(email, password);
    localStorage.setItem('kc_token', token);
    setUser(user);
    return user;
  };

  const logout = () => {
    localStorage.removeItem('kc_token');
    setUser(null);
  };

  const updateUser = (patch) => setUser((u) => ({ ...u, ...patch }));

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, updateUser, reload: loadMe }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
