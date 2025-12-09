// src/redux/postSlice.js
import { createSlice } from "@reduxjs/toolkit";

const postSlice = createSlice({
  name: "post",
  initialState: {
    posts: [],
    selectedPost: null,
  },
  reducers: {
    // Accepts an array but filters out invalid posts defensively
    setPosts: (state, action) => {
      state.posts = Array.isArray(action.payload) ? action.payload : [];
    },

    addPost: (state, action) => {
      const post = action.payload;
      if (!post) return;
      state.posts = [post, ...state.posts];
    },

    removePost: (state, action) => {
      const id = action.payload;
      state.posts = state.posts.filter((p) => p._id !== id);
    },

    updatePost: (state, action) => {
      const updated = action.payload;
      state.posts = state.posts.map((p) =>
        p._id === updated._id ? updated : p
      );
    },

    setSelectedPost: (state, action) => {
      state.selectedPost = action.payload;
    },

    cleanupInvalidPosts: (state) => {
      state.posts = state.posts.filter((post) => post?.author?._id);
    },
  },
});

export const {
  setPosts,
  addPost,
  removePost,
  updatePost,
  setSelectedPost,
  cleanupInvalidPosts,
} = postSlice.actions;
export default postSlice.reducer;
