import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  active: false,
  progress: 0,
  totalFiles: 0,
  message: "",
};

const uploadSlice = createSlice({
  name: "upload",
  initialState,
  reducers: {
    startUpload(state, action) {
      state.active = true;
      state.progress = 0;
      state.totalFiles = action.payload.totalFiles;
      state.message = "Uploading photos…";
    },

    setProgress(state, action) {
      state.progress = action.payload;
    },

    setMessage(state, action) {
      state.message = action.payload;
    },

    finishUpload(state) {
      state.progress = 100;
      state.message = "Upload complete";
      state.active = false;
    },

    resetUpload() {
      return initialState;
    },
  },
});

export const {
  startUpload,
  setProgress,
  setMessage,
  finishUpload,
  resetUpload,
} = uploadSlice.actions;

export default uploadSlice.reducer;
