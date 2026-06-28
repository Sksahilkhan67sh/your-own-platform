import { useEffect, useCallback } from 'react';
import { useAuthStore } from '../store/authStore.js';
import { loginRequest, logoutRequest } from '../lib/authApi.js';
import { refreshAccessToken } from '../lib/apiClient.js';

export function useAuth() {
  const { accessToken, user, isAuthResolved, setSession, clearSession } = useAuthStore();

  const login = useCallback(
    async (email, password) => {
      const result = await loginRequest({ email, password });
      setSession(result);
      return result;
    },
    [setSession]
  );

  const logout = useCallback(async () => {
    await logoutRequest().catch(() => null);
    clearSession();
  }, [clearSession]);

  return {
    accessToken,
    user,
    isAuthenticated: Boolean(accessToken && user),
    isAuthResolved,
    login,
    logout,
  };
}

/**
 * Call once near the app root. On mount, attempts a silent refresh —
 * if the httpOnly refresh cookie is still valid from a previous visit,
 * this recovers the session without the user having to log in again,
 * even though the in-memory access token was lost on page reload.
 */
export function useAuthBootstrap() {
  const { clearSession, isAuthResolved } = useAuthStore();

  useEffect(() => {
    if (isAuthResolved) return;

    refreshAccessToken()
      .then(() => {
        // setSession already called inside refreshAccessToken on success
      })
      .catch(() => {
        clearSession(); // marks isAuthResolved = true with no session — expected for a logged-out visitor
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { isAuthResolved };
}
