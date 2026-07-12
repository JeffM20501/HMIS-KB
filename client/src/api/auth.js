import client from "./client";
import { decodeJwtPayload } from "../utils/jwt";
import { normalizeUser } from "../utils/normalize";

/**
 * POST /api/v1/auth/token/ (TokenObtainPairView)
 * ASSUMPTION: SimpleJWT uses "username" field.
 */
export const obtainToken = (username, password) =>
  client
    .post("/auth/token/", { username, password })
    .then((res) => res.data);

/** POST /api/v1/auth/token/refresh/ */
export const refreshToken = (refresh) =>
  client
    .post("/auth/token/refresh/", { refresh })
    .then((res) => res.data);

/** POST /api/v1/auth/token/verify/ */
export const verifyToken = (token) =>
  client
    .post("/auth/token/verify/", { token })
    .then((res) => res.data);

/**
 * POST /api/v1/u/users/
 */
export const register = ({ username, email, department, password }) =>
  client
    .post("/u/users/", {
      username,
      email,
      department,
      password,
    })
    .then((res) => res.data);
/**
 * GET /api/v1/u/users/me/ - custom @action on UserViewSet
 */
export const fetchCurrentUser = async (accessToken) => {
  try {
    const response = await client.get("/u/users/me/");
    return normalizeUser(response.data);
  } catch {
    const payload = decodeJwtPayload(accessToken);
    const userId = payload?.user_id ?? payload?.id;
    if (!userId) return Promise.reject(new Error("Could not read user id from token."));
    const response = await client.get(`/u/users/${userId}/`);
    return normalizeUser(response.data);
  }
};

/** POST /api/v1/u/auth/request-password-reset/ */
export const requestPasswordReset = (email) =>
  client
    .post("/u/auth/request-password-reset/", { email })
    .then((res) => res.data);

/** POST /api/v1/u/auth/verify-otp/  */
export const verifyOtp = (email, otp) =>
  client
    .post("/u/auth/verify-otp/", { email, otp })
    .then((res) => res.data);


/**
 * POST /api/v1/u/auth/reset-password/
 * This resets the password using email + OTP + new password.
 */
export const resetPassword = (email, otp, newPassword) =>
  client
    .post("/u/auth/reset-password/", { email, otp, new_password: newPassword })
    .then((res) => res.data);


/** SimpleJWT logout - discard tokens locally. */
export const logout = () => Promise.resolve();