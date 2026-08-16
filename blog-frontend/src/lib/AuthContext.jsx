import React, { createContext, useContext, useEffect, useState } from 'react';
import { apiRequest, clearToken, getToken, setTokens } from '@/api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!getToken()) {
      setLoading(false);
      return;
    }
    apiRequest('/auth/me')
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  const login = async (email, password) => {
    const result = await apiRequest('/auth/login', {
      method: 'POST',
      body: { email, password },
    });
    setTokens({ accessToken: result.accessToken, refreshToken: result.refreshToken });
    setUser(result.user);
    return result.user;
  };

  const logout = async () => {
    clearToken();
    setUser(null);
    window.location.href = '/admin/login';
  };

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      login,
      logout,
      isAdmin: user?.role === 'admin',
      isAuthenticated: !!user,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

// ICSTest compatibility
export function useStaffAuth() {
  return useAuth();
}
