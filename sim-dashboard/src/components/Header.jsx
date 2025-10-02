// src/components/Header.jsx
import { useNavigate } from "react-router-dom";

export default function Header() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user"));

  function handleLogout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  }

  return (
    <header className="fixed top-0 left-0 w-full bg-blue-600 text-white shadow-md z-50">
      <div className="max-w-7xl mx-auto flex justify-between items-center px-6 py-3">
        
        {/* Company Name */}
        <h1 
          className="text-xl font-bold tracking-wide cursor-pointer"
          onClick={() => navigate("/dashboard")}
        >
          SIMTrackr
        </h1>

        {/* User Info + Logout */}
        <div className="flex items-center gap-4">
          {user && (
            <span className="text-sm font-medium">
              Welcome, {user.name}
            </span>
          )}
          <button
            onClick={handleLogout}
            className="px-3 py-1 bg-red-500 hover:bg-red-600 rounded text-white text-sm"
          >
            Logout
          </button>
        </div>
      </div>
    </header>
  );
}
