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
