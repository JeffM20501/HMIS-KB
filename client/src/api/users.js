import client from "./client";
import { normalizeUser, normalizeUserList } from "../utils/normalize";

/** GET /api/v1/u/users/ */
export const listUsers = (params = {}) =>
  client.get("/u/users/", { params }).then((res) => ({
    ...res.data,
    users: normalizeUserList(res.data.results ?? res.data),
  }));

/** GET /api/v1/u/users/:id/ */
export const getUser = (id) =>
  client.get(`/u/users/${id}/`)
    .then((res) => normalizeUser(res.data));

/**
 * PATCH /api/v1/u/users/:id/ — admin changes role
 * If you added a dedicated @action, use that instead.
 */
export const updateUserRole = (id, role) =>
  client.patch(`/u/users/${id}/`, { role }).then((res) => normalizeUser(res.data));

/** PATCH /api/v1/u/users/:id/ — suspend/activate */
export const updateUserStatus = (id, isActive) =>
  client.patch(`/u/users/${id}/`, { is_active: isActive }).then((res) => normalizeUser(res.data));

/** DELETE /api/v1/u/users/:id/ */
export const deleteUser = (id) => client.delete(`/u/users/${id}/`).then((res) => res.data);

/** PATCH /api/v1/u/users/:id/ — update own profile */
export const updateProfile = (userId, payload) => {
  
  const headers = payload instanceof FormData ? {} : { 'Content-Type': 'application/json' };
  return client.patch(`/u/users/${userId}/`, payload, { headers }).then((res) => res.data);
};

/** POST /api/v1/u/users/:id/change_role/ - if you added @action */
export const changeUserRole = (id, newRole) =>
  client.post(`/u/users/${id}/change_role/`, { role: newRole }).then((res) => res.data);

export const changePassword = (id, currentPassword, newPassword) =>
  client
    .post(`/u/users/${id}/set-password/`, {
      current_password: currentPassword,
      new_password: newPassword,
    })
    .then((res) => res.data);

export const uploadAvatar = (userId, file) => {
  const formData = new FormData();
  formData.append('avatar', file);
  return client
    .patch(`/u/users/${userId}/update_avatar/`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    .then((res) => res.data);
};

