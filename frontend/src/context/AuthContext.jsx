import { createContext, useState, useEffect } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from '../firebase';
import api from '../utils/api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          // Send request to our backend to sync the user and get their MongoDB profile
          const res = await api.post('/auth/sync', {
            // we can pass extra info if needed, but email is in the token
          });
          setUser(res.data);
        } catch (error) {
          console.error("Failed to sync user with backend:", error);
          setUser(null);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const logout = async () => {
    try {
      await signOut(auth);
      setUser(null);
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const refreshUser = async () => {
    if (!auth.currentUser) return;
    try {
      const res = await api.get('/auth/me');
      setUser(res.data);
    } catch (error) {
      console.error("User refresh failed:", error);
    }
  };

  // We don't need loginWithToken anymore, Firebase manages auth state automatically

  return (
    <AuthContext.Provider value={{ user, setUser, logout, refreshUser, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
