// src/redux/store.js
import { configureStore, combineReducers } from "@reduxjs/toolkit";
import storage from "redux-persist/lib/storage";
import { persistReducer, persistStore } from "redux-persist";
import authSlice from "./authslice.js";

const rootReducer = combineReducers({
  auth: authSlice,
});

const persistConfig = {
  key: "root",
  storage,
  whitelist: ["auth"], // only auth will be persisted
};

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false, // required for persist
    }),
});

export const persistor = persistStore(store);
