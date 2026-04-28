import { createContext, useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';
import api from '../utils/api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const decoded = jwtDecode(token);
          // Check expiration
          if (decoded.exp * 1000 < Date.now()) {
            logout();
          } else {
            // Fetch updated user info
            const res = await api.get('/auth/me');
            setUser(res.data);
          }
        } catch (error) {
          console.error("Auth init failed:", error);
          logout();
        }
      }
      setLoading(false);
    };
    initAuth();
  }, []);

  const loginWithToken = async (token) => {
    localStorage.setItem('token', token);
    const res = await api.get('/auth/me');
    setUser(res.data);
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, setUser, loginWithToken, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
