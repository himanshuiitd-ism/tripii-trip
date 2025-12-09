import api from "./axios.js";

export const getSuggestedUsers = () =>
  api.get("/api/auth/suggested-users", { withCredentials: true });

export const followOrUnfollow = (userId) =>
  api.post(`/api/auth/follow/${userId}`, {}, { withCredentials: true });

export const getProfile = (userId) =>
  api.get(`/api/auth/profile/${userId}`, { withCredentials: true });

export const searchUsers = (q, page = 1, limit = 10) =>
  api.get(
    `/api/auth/search?query=${encodeURIComponent(
      q
    )}&page=${page}&limit=${limit}`,
    { withCredentials: true }
  );

export const editProfile = (formData) =>
  api.put("/api/auth/edit-profile", formData, {
    withCredentials: true,
    headers: { "Content-Type": "multipart/form-data" },
  });

export const getMe = () => api.get("/api/auth/me", { withCredentials: true });
