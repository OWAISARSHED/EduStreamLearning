import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { auth } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  // true while we are verifying the stored token on startup
  const [initializing, setInitializing] = useState(true);

  // On mount: verify token with backend — don't trust localStorage blindly
  useEffect(() => {
    const token = localStorage.getItem('edustream_token');
    if (!token) {
      setInitializing(false);
      return;
    }
    auth.me()
      .then((data) => {
        setUser(data.user || data);
        localStorage.setItem('edustream_user', JSON.stringify(data.user || data));
      })
      .catch(() => {
        // Token invalid/expired — clear everything
        localStorage.removeItem('edustream_token');
        localStorage.removeItem('edustream_user');
        setUser(null);
      })
      .finally(() => setInitializing(false));
  }, []);

  const [loading, setLoading] = useState(false);

  const login = useCallback(async (email, password) => {
    setLoading(true);
    try {
      const data = await auth.login(email, password);
      localStorage.setItem('edustream_token', data.token);
      localStorage.setItem('edustream_user', JSON.stringify(data.user));
      setUser(data.user);
      return data.user;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem('edustream_token');
    localStorage.removeItem('edustream_user');
  }, []);

  const isRole = useCallback((...roles) => {
    return user && roles.includes(user.role);
  }, [user]);

  return (
    <AuthContext.Provider value={{ user, login, loading, logout, isRole, initializing }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
