// src/App.jsx
import { Routes, Route } from "react-router-dom";
import AppLayout from "@/components/layout/AppLayout";
import HomePage from "@/pages/HomePage";
import AuthPage from "@/pages/auth/AuthPage";

export default function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/auth" element={<AuthPage />} />
      </Route>
    </Routes>
  );
}
