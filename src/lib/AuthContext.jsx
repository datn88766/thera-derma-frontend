import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { auth } from '@/api/entities';
import { getToken, clearToken } from '@/api/client';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [authChecked, setAuthChecked] = useState(false);

  const checkUserAuth = useCallback(async () => {
    try {
      setIsLoadingAuth(true);
      if (!getToken()) {
        setUser(null);
        setIsAuthenticated(false);
        return;
      }
      const currentUser = await auth.me();
      setUser(currentUser);
      setIsAuthenticated(true);
    } catch {
      // Token invalid/expired — drop it so we don't keep retrying with it
      clearToken();
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setIsLoadingAuth(false);
      setAuthChecked(true);
    }
  }, []);

  useEffect(() => {
    checkUserAuth();
  }, [checkUserAuth]);

  const login = async (email, password) => {
    const currentUser = await auth.login(email, password);
    setUser(currentUser);
    setIsAuthenticated(true);
    return currentUser;
  };

  const logout = (redirectUrl = '/') => {
    setUser(null);
    setIsAuthenticated(false);
    auth.logout(redirectUrl);
  };

  const navigateToLogin = () => {
    auth.redirectToLogin(window.location.pathname);
  };

  const hasRole = (...roles) => isAuthenticated && !!user && roles.includes(user.role);

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated,
      isLoadingAuth,
      isLoadingPublicSettings: false,
      authError: null,
      appPublicSettings: null,
      authChecked,
      login,
      logout,
      hasRole,
      navigateToLogin,
      checkUserAuth,
      refreshMe: checkUserAuth,
      checkAppState: checkUserAuth,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
