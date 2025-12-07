// src/hooks/useAuth.js
import { useSelector } from "react-redux";

export default function useAuth() {
  const auth = useSelector((s) => s.auth);
  return {
    user: auth?.user || null,
    accessToken: auth?.accessToken || null,
    isLoggedIn: !!auth?.user,
  };
}
