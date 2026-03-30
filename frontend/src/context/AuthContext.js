import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { getMe, logout as logoutService } from '../services/auth';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(true);

  const refreshProfile = useCallback(async () => {
    setLoadingProfile(true);
    const result = await getMe();
    if (result.success) {
      setUser(result.user);
    } else {
      setUser(null);
    }
    setLoadingProfile(false);
    return result;
  }, []);

  const clearSession = useCallback(async () => {
    await logoutService();
    setUser(null);
  }, []);

  useEffect(() => {
    refreshProfile();
  }, [refreshProfile]);

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = React.useMemo(
    () => ({ user, setUser, refreshProfile, clearSession, loadingProfile }),
    [user, refreshProfile, clearSession, loadingProfile]
  );
  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
