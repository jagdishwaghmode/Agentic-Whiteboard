import { createContext, useContext, useEffect, useState } from 'react';
import { onAuthChange, logout as firebaseLogout } from '../services/firebase';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribe = () => {};
    try {
      unsubscribe = onAuthChange((firebaseUser) => {
        setUser(firebaseUser);
        setLoading(false);
      });
    } catch (err) {
      console.warn('Auth state subscription failed:', err);
      setLoading(false);
    }
    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, []);

  const logout = async () => {
    await firebaseLogout();
    setUser(null);
  };

  const value = {
    user,
    loading,
    logout,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
