// src/api/axios.js
import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:3000",
  withCredentials: true,
  headers: {
    Accept: "application/json",
  },
});

export default api;
