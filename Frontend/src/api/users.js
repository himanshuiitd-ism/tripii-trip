// src/api/users.js
import api from "./axios.js";

export const followUser = (userId) =>
  api.post(`/api/user/follow/${userId}`, {}, { withCredentials: true });

export const getSuggestedUsers = () =>
  api.get("/api/user/suggested", { withCredentials: true });
