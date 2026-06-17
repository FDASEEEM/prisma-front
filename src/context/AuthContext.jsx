/**
 * AuthContext
 * Contexto para manejar estado de autenticación a nivel global
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import storageUtils from '../utils/localStorage';
import { resetAuthRedirectLock } from '../services/authSession';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPERADMIN';
  const isSuperAdmin = user?.role === 'SUPERADMIN';

  // Recuperar sesión al montar el componente
  useEffect(() => {
    const storedUser = storageUtils.getUser();
    if (storedUser && storageUtils.getToken()) {
      setUser(storedUser);
      setIsAuthenticated(true);
      resetAuthRedirectLock();
    }
    setIsLoading(false);
  }, []);

  // Verificar expiración del token periódicamente (cada 60s)
  useEffect(() => {
    const isTokenExpired = (token) => {
      if (!token) return true;
      try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const payload = JSON.parse(window.atob(base64));
        return payload.exp * 1000 < Date.now();
      } catch {
        return true;
      }
    };

    const checkToken = () => {
      const token = storageUtils.getToken();
      if (token && isTokenExpired(token)) {
        storageUtils.clearSession();
        setUser(null);
        setIsAuthenticated(false);
        if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
          window.location.replace('/login');
        }
      }
    };

    checkToken();
    const interval = setInterval(checkToken, 60000);
    return () => clearInterval(interval);
  }, []);

  const login = (userData, tokens) => {
    storageUtils.saveUser(userData);
    storageUtils.saveToken(tokens.access_token);
    storageUtils.saveRefreshToken(tokens.refresh_token);
    setUser(userData);
    setIsAuthenticated(true);
    resetAuthRedirectLock();
  };

  const logout = () => {
    storageUtils.clearSession();
    setUser(null);
    setIsAuthenticated(false);
    resetAuthRedirectLock();
  };

  const updateUser = (updatedData) => {
    const newUser = { ...user, ...updatedData };
    storageUtils.saveUser(newUser);
    setUser(newUser);
  };

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated,
      isLoading,
      isAdmin,
      isSuperAdmin,
      login,
      logout,
      updateUser,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser usado dentro de AuthProvider');
  }
  return context;
};
