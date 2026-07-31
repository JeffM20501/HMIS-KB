import { createContext, useCallback, useEffect, useState } from 'react';
import * as authApi from '../api/auth.api';
import * as usersApi from '../api/users.api';
import { getAccessToken, setTokens, clearTokens } from '../api/axios';
import { ROLES } from '../constants/auth';

export const AuthContext = createContext(null);

// FR-3.5: sessions expire after 8 hours of inactivity — tracked client-side,
// the server-side JWT expiry is the authoritative control.
const INACTIVITY_LIMIT_MS = 8 * 60 * 60 * 1000;

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadUser = useCallback(async () => {
    if (!getAccessToken()) {
      setUser(null);
      setIsLoading(false);
      return;
    }
    try {
      const me = await usersApi.getCurrentUser();
      setUser(me);
    } catch {
      clearTokens();
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  // Inactivity timeout
  useEffect(() => {
    if (!user) return undefined;
    let timer = setTimeout(logout, INACTIVITY_LIMIT_MS);
    const resetTimer = () => {
      clearTimeout(timer);
      timer = setTimeout(logout, INACTIVITY_LIMIT_MS);
    };
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
    events.forEach((e) => window.addEventListener(e, resetTimer));
    return () => {
      clearTimeout(timer);
      events.forEach((e) => window.removeEventListener(e, resetTimer));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const login = useCallback(async (credentials) => {
    const tokens = await authApi.login(credentials);
    setTokens(tokens);
    const me = await usersApi.getCurrentUser();
    setUser(me);
    return me;
  }, []);

  const logout = useCallback(() => {
    clearTokens();
    setUser(null);
    window.location.href = '/login';
  }, []);

  const refreshCurrentUser = useCallback(async () => {
    const me = await usersApi.getCurrentUser();
    setUser(me);
    return me;
  }, []);

  const value = {
    user,
    isLoading,
    isAuthenticated: !!user,
    isAdmin: user?.role === ROLES.ADMIN,
    isEditor: user?.role === ROLES.EDITOR,
    hasRole: (...roles) => !!user && roles.includes(user.role),
    login,
    logout,
    refreshCurrentUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
