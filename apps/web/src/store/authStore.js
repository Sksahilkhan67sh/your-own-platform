import { create } from 'zustand';

/**
 * Deliberately NOT using zustand's persist middleware here.
 * The access token must live only in memory — persisting it to
 * localStorage/sessionStorage would make it readable by any injected
 * script (XSS), defeating the httpOnly-cookie design for the refresh
 * token. Losing the access token on a hard refresh is the correct
 * trade-off; useAuthBootstrap() (see hooks/useAuth.js) silently calls
 * /auth/refresh on app load to recover a session from the httpOnly cookie.
 */
export const useAuthStore = create((set) => ({
  accessToken: null,
  user: null,
  isAuthResolved: false, // true once initial bootstrap (refresh attempt) completes

  setSession: ({ accessToken, user }) => set({ accessToken, user, isAuthResolved: true }),

  clearSession: () => set({ accessToken: null, user: null, isAuthResolved: true }),

  setAccessToken: (accessToken) => set({ accessToken }),
}));
