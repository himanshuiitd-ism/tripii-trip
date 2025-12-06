import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import AuthPage from "./pages/auth/AuthPage";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Auth Page */}
        <Route path="/auth" element={<AuthPage />} />
      </Routes>
    </BrowserRouter>
  );
}
