import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [family, setFamily] = useState(null);
  const [loading, setLoading] = useState(!!localStorage.getItem('df_token'));

  const refresh = useCallback(async () => {
    try {
      const { data } = await api.get('/auth/me');
      setUser(data.user); setFamily(data.family);
    } catch { localStorage.removeItem('df_token'); setUser(null); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { if (localStorage.getItem('df_token')) refresh(); }, [refresh]);

  const authenticate = (data) => {
    localStorage.setItem('df_token', data.token);
    setUser(data.user); setFamily(data.family);
  };
  const login = async (email, password) => authenticate((await api.post('/auth/login', { email, password })).data);
  const register = async (form) => authenticate((await api.post('/auth/register', form)).data);
  const logout = () => { localStorage.removeItem('df_token'); setUser(null); setFamily(null); };

  return (
    <AuthContext.Provider value={{ user, family, loading, login, register, logout, refresh, isAdmin: user?.role === 'Admin' }}>
      {children}
    </AuthContext.Provider>
  );
}
