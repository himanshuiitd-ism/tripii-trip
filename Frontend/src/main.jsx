// src/main.jsx
import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Provider } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";
import AppLayout from "@/components/layout/AppLayout";
import HomePage from "@/pages/HomePage";
import AuthPage from "@/pages/auth/AuthPage";
import { store, persistor } from "@/redux/store";

import "./index.css";

createRoot(document.getElementById("root")).render(
  <Provider store={store}>
    <PersistGate loading={null} persistor={persistor}>
      <BrowserRouter>
        <Routes>
          <Route element={<AppLayout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/auth" element={<AuthPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </PersistGate>
  </Provider>
);
