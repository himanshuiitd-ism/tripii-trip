import api from "./axios.js";

export const getFeed = ({ page = 1, limit = 10 } = {}) =>
  api.get(`/api/post/getPosts?page=${page}&limit=${limit}`, {
    withCredentials: true,
  });

export const createPost = (formData) =>
  api.post("/api/post/createPost", formData, {
    headers: { "Content-Type": "multipart/form-data" },
    withCredentials: true,
  });

export const createTripPost = (formData) =>
  api.post("/api/post/createTripPost", formData, {
    headers: { "Content-Type": "multipart/form-data" },
    withCredentials: true,
  });

export const toggleLike = (postId) =>
  api.post(`/api/post/like/${postId}`, {}, { withCredentials: true });

export const addComment = (postId, text) =>
  api.post(`/api/post/comment/${postId}`, { text }, { withCredentials: true });

export const deletePost = (postId) =>
  api.delete(`/api/post/deletePost/${postId}`, { withCredentials: true });

export const getPostById = (postId) =>
  api.get(`/api/post/getPost/${postId}`, { withCredentials: true });

export const toggleBookmark = (postId) =>
  api.post(`/api/post/bookMark/${postId}`, {}, { withCredentials: true });
