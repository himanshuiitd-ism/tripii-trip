import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:8000/api/auth",
  withCredentials: true,
});

// SIGNUP
export const registerRequest = async (data) => {
  return API.post("/register", data);
};

// LOGIN (username or email)
export const loginRequest = async (data) => {
  return API.post("/login", data);
};

// GOOGLE LOGIN
export const googleLoginRequest = async (credential) => {
  return API.post("/google", { credential });
};
