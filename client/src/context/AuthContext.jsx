import { createContext, useCallback, useEffect, useMemo, useState } from "react";
import * as authApi from "../api/auth";
import { getAccessToken, getRefreshToken, setTokens, clearTokens } from "../api/client";
import { ROLES } from "../utils/constants";

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [initializing, setInitializing] = useState(true);
  const [authError, setAuthError] = useState("");

  // On mount: if tokens are already stored, hydrate the session from the
  // access token's user_id claim (see api/auth.js — no /me endpoint exists yet).
  useEffect(() => {
    const access = getAccessToken();
    const refresh = getRefreshToken();
    if (!access || !refresh) {
      setInitializing(false);
      return;
    }
    authApi
      .fetchCurrentUser(access)
      .then((data) => setUser(data))
      .catch(() => clearTokens())
      .finally(() => setInitializing(false));
  }, []);

  // Force logout if any API call comes back 401 after a failed refresh
  useEffect(() => {
    const handleUnauthorized = () => setUser(null);
    window.addEventListener("healthkb:unauthorized", handleUnauthorized);
    return () => window.removeEventListener("healthkb:unauthorized", handleUnauthorized);
  }, []);

  const login = useCallback(async (username, password) => {
    setAuthError("");
    const { access, refresh } = await authApi.obtainToken(username, password);
    setTokens({ access, refresh });
    const me = await authApi.fetchCurrentUser(access);
    setUser(me);
    return me;
  }, []);

  const register = useCallback(async (payload) => {
    setAuthError("");
    // Role is never sent from the client — every new account is created as
    // "viewer" server-side and must be upgraded by an Admin afterwards.
    return authApi.register(payload);
  }, []);

  const logout = useCallback(async () => {
    await authApi.logout();
    clearTokens();
    setUser(null);
  }, []);

  const refreshUser = useCallback(async () => {
    const access = getAccessToken();
    const data = await authApi.fetchCurrentUser(access);
    setUser(data);
    return data;
  }, []);

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      initializing,
      authError,
      setAuthError,
      login,
      register,
      logout,
      refreshUser,
      setUser,
      isAdmin: user?.role === ROLES.ADMIN,
      isEditor: user?.role === ROLES.EDITOR || user?.role === ROLES.ADMIN,
    }),
    [user, initializing, authError, login, register, logout, refreshUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
