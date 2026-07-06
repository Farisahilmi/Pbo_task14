import React, { createContext, useState, useEffect, useContext } from 'react';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAuthModal, setShowAuthModal] = useState(false);

  useEffect(() => {
    // sessionStorage clears on tab/browser close → always start fresh (logged out)
    const storedUser = sessionStorage.getItem('mtx_user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        sessionStorage.removeItem('mtx_user');
      }
    }
    setLoading(false);
  }, []);

  const login = (userData, token) => {
    if (token) sessionStorage.setItem('mtx_token', token);
    sessionStorage.setItem('mtx_user', JSON.stringify(userData));
    setUser(userData);
  };

  const logout = () => {
    sessionStorage.removeItem('mtx_token');
    sessionStorage.removeItem('mtx_user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading, showAuthModal, setShowAuthModal }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
