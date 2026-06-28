import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/ApiResponse.js';
import { getRefreshCookieOptions, REFRESH_COOKIE_NAME } from '../utils/cookies.js';
import * as authService from '../services/authService.js';

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const result = await authService.login({
    email,
    password,
    userAgent: req.headers['user-agent'],
    ip: req.ip,
  });

  const maxAgeMs = result.refreshExpiresAt.getTime() - Date.now();
  res.cookie(REFRESH_COOKIE_NAME, result.refreshToken, getRefreshCookieOptions(maxAgeMs));

  sendSuccess(res, {
    data: { accessToken: result.accessToken, user: result.user },
  });
});

export const refresh = asyncHandler(async (req, res) => {
  const incomingToken = req.cookies?.[REFRESH_COOKIE_NAME];

  const result = await authService.refreshSession({
    refreshToken: incomingToken,
    userAgent: req.headers['user-agent'],
    ip: req.ip,
  });

  const maxAgeMs = result.refreshExpiresAt.getTime() - Date.now();
  res.cookie(REFRESH_COOKIE_NAME, result.refreshToken, getRefreshCookieOptions(maxAgeMs));

  sendSuccess(res, {
    data: { accessToken: result.accessToken, user: result.user },
  });
});

export const logout = asyncHandler(async (req, res) => {
  const incomingToken = req.cookies?.[REFRESH_COOKIE_NAME];
  await authService.logout({ refreshToken: incomingToken });

  res.clearCookie(REFRESH_COOKIE_NAME, { path: '/api/v1/auth' });
  sendSuccess(res, { data: { loggedOut: true } });
});

export const me = asyncHandler(async (req, res) => {
  const user = await authService.getCurrentUser(req.user.id);
  sendSuccess(res, { data: { user: user.toJSON() } });
});
