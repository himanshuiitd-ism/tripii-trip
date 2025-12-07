// src/components/home/NavBar.jsx
import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import useAuth from "@/hooks/useAuth";

export default function NavBar() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-surface-light dark:bg-surface-dark border-b border-border-light dark:border-border-dark">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4 p-3 md:p-4">
        <div className="flex items-center gap-4">
          <button
            className="p-2 rounded-md bg-primary/90 text-white hidden md:inline-flex"
            onClick={() => navigate("/")}
          >
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none">
              <path
                d="M12 2L3 7v7c0 5 9 8 9 8s9-3 9-8V7l-9-5z"
                fill="currentColor"
              />
            </svg>
          </button>

          <Link to="/" className="flex items-center gap-2">
            <div className="text-primary text-2xl font-extrabold">⛰️</div>
            <div className="hidden sm:block text-lg font-bold">TripiiTrip</div>
          </Link>

          <div className="hidden md:block">
            <input
              type="search"
              placeholder="Search"
              className="w-64 px-3 py-2 rounded-lg border border-border-light bg-background-light focus:outline-none"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <nav className="hidden lg:flex gap-6">
            <Link className="text-sm font-medium" to="/">
              Inspiration
            </Link>
            <Link className="text-sm font-medium" to="/communities">
              Communities
            </Link>
            <Link className="text-sm font-medium" to="/trips">
              Trips
            </Link>
            <Link className="text-sm font-medium" to="/about">
              About
            </Link>
          </nav>

          <div className="flex items-center gap-2">
            <button className="p-2 rounded-md bg-primary text-white hidden sm:inline">
              Create a Trip
            </button>

            <button
              className="p-2 rounded-md bg-background-light dark:bg-background-dark"
              aria-label="notifications"
            >
              <span className="material-symbols-outlined">notifications</span>
            </button>

            <button
              className="p-2 rounded-md bg-background-light dark:bg-background-dark"
              aria-label="chat"
            >
              <span className="material-symbols-outlined">chat_bubble</span>
            </button>

            <div className="relative">
              {user ? (
                <img
                  src={user.profilePicture?.url || "/fallbackbg.jpg"}
                  alt="profile"
                  className="w-10 h-10 rounded-full object-cover cursor-pointer"
                  onClick={() => navigate(`/profile/${user._id}`)}
                />
              ) : (
                <button
                  className="px-3 py-1 rounded-md bg-primary text-white text-sm"
                  onClick={() => navigate("/auth")}
                >
                  Sign in
                </button>
              )}
            </div>

            {/* mobile menu */}
            <button
              className="lg:hidden p-2"
              onClick={() => setOpen((s) => !s)}
              aria-label="menu"
            >
              <span className="material-symbols-outlined">menu</span>
            </button>
          </div>
        </div>
      </div>

      {/* mobile nav */}
      {open && (
        <div className="lg:hidden border-t border-border-light bg-surface-light dark:bg-surface-dark">
          <div className="max-w-7xl mx-auto p-3 flex flex-col gap-2">
            <Link to="/" className="py-2">
              Home
            </Link>
            <Link to="/communities" className="py-2">
              Communities
            </Link>
            <Link to="/trips" className="py-2">
              Trips
            </Link>
            <Link to="/about" className="py-2">
              About
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
