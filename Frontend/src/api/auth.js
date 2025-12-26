// src/api/auth.js
import api from "./axios";

// LOGIN
export const loginRequest = (payload) =>
  api.post("/api/auth/login", payload, { withCredentials: true });

// REGISTER
export const registerRequest = (payload) =>
  api.post("/api/auth/register", payload, { withCredentials: true });

// GOOGLE LOGIN
export const googleLoginRequest = (credential) =>
  api.post("/api/auth/google", { credential }, { withCredentials: true });

// LOGOUT (THE MISSING ONE CAUSING YOUR ERROR)
export const logoutRequest = () =>
  api.post("/api/auth/logout", {}, { withCredentials: true });

// FETCH PROFILE (if needed later)
export const getMyProfile = () =>
  api.get("/api/auth/profile/me", { withCredentials: true });
