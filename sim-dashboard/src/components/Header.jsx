// src/components/Header.jsx
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { Signals } from "lucide-react"; // 👈 import an icon from lucide-react

export default function Header() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user"));

  useEffect(() => {
    if (!user) {
      navigate("/login");
    }
  }, [user, navigate]);

  function handleLogout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  }

  const userInitial = user?.name ? user.name.charAt(0).toUpperCase() : "U";

  return (
    <header className="fixed top-0 left-0 w-full bg-blue-600 text-white shadow-md z-50">
      <div className="max-w-7xl mx-auto flex justify-between items-center px-6 py-3">
        
        {/* Logo + Company Name */}
        <div
          onClick={() => navigate("/dashboard")}
          className="flex items-center gap-2 cursor-pointer hover:opacity-90 transition"
        >
          <Signals size={24} className="text-white" /> {/* 👈 icon added */}
          <h1 className="text-xl font-bold tracking-wide">SIMTrackr</h1>
        </div>

        {/* User Info + Logout */}
        <div className="flex items-center gap-4">
          {user && (
            <>
              <span className="text-sm font-medium">Welcome, {user.name}</span>
              <div className="w-9 h-9 rounded-full bg-white text-blue-600 flex items-center justify-center font-bold">
                {userInitial}
              </div>
            </>
          )}
          <button
            onClick={handleLogout}
            className="px-3 py-1 bg-red-500 hover:bg-red-600 rounded text-white text-sm transition"
          >
            Logout
          </button>
        </div>
      </div>
    </header>
  );
}
