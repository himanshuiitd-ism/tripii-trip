// src/api/auth.js
import api from "./axios.js";

export const loginRequest = (payload) =>
  api.post("/api/auth/login", payload, { withCredentials: true });

export const registerRequest = (payload) =>
  api.post("/api/auth/register", payload, { withCredentials: true });

export const googleLoginRequest = (credential) =>
  api.post("/api/auth/google", { credential }, { withCredentials: true });

export const getProfile = () =>
  api.get("/api/user/me", { withCredentials: true });
