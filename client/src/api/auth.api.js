import api from './axios';

// POST /api/v1/auth/token/  -> { access, refresh }
export const login = (credentials) => api.post('/auth/token/', credentials).then((r) => r.data);

// POST /api/v1/auth/token/refresh/
export const refreshToken = (refresh) => api.post('/auth/token/refresh/', { refresh }).then((r) => r.data);

// POST /api/v1/auth/token/verify
export const verifyToken = (token) => api.post('/auth/token/verify', { token }).then((r) => r.data);

// POST /api/v1/u/auth/request-password-reset/
export const requestPasswordReset = (email) =>
  api.post('/u/auth/request-password-reset/', { email }).then((r) => r.data);

// POST /api/v1/u/auth/verify-otp/
export const verifyOtp = ({ email, otp }) => api.post('/u/auth/verify-otp/', { email, otp }).then((r) => r.data);

// POST /api/v1/u/auth/reset-password/
export const resetPassword = ({ email, otp, new_password }) =>
  api.post('/u/auth/reset-password/', { email, otp, new_password }).then((r) => r.data);
