import { useSelector, useDispatch } from "react-redux";
import { useCallback } from "react";
import { logoutRequest } from "@/api/auth";
import { logoutUser } from "@/redux/authslice";

function useAuth() {
  const dispatch = useDispatch();

  const user = useSelector((state) => state.auth.user);

  const logout = useCallback(async () => {
    try {
      await logoutRequest(); // backend logout
    } catch (err) {
      console.error("Logout error:", err);
    }
    dispatch(logoutUser());
  }, [dispatch]);

  return {
    user,
    isAuthenticated: !!user,
    logout,
  };
}

export default useAuth; // ✅ FIX: DEFAULT EXPORT
