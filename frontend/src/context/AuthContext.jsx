import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { login as apiLogin, register as apiRegister, getMe } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  const loadUser = useCallback(async () => {
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      const userData = await getMe();
      setUser(userData);
    } catch {
      localStorage.removeItem('token');
      setToken(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  const login = async (username, password) => {
    const data = await apiLogin(username, password);
    const accessToken = data.access_token;
    localStorage.setItem('token', accessToken);
    setToken(accessToken);
    const userData = await getMe();
    setUser(userData);
    return userData;
  };

  const register = async (username, email, password) => {
    const data = await apiRegister(username, email, password);
    // After registration, auto-login
    return login(username, password);
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;
