import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { Signal, Menu } from "lucide-react";

export default function Header({ onToggleSidebar }) {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user"));

  useEffect(() => {
    if (!user) navigate("/login");
  }, [user, navigate]);

  function handleLogout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  }

  const userInitial = user?.name ? user.name.charAt(0).toUpperCase() : "U";

  return (
    <header className="fixed top-0 left-0 w-full bg-blue-600 text-white shadow-md z-50">
      <div className="max-w-7xl mx-auto flex justify-between items-center px-4 sm:px-6 py-3">
        
        {/* Left side: Logo + Menu */}
        <div className="flex items-center gap-3">
          {/* Hamburger Menu (mobile only) */}
          <button
            onClick={onToggleSidebar}
            className="sm:hidden p-2 rounded hover:bg-blue-500 transition"
          >
            <Menu size={22} />
          </button>

          {/* Logo */}
          <div
            onClick={() => navigate("/dashboard")}
            className="flex items-center gap-2 cursor-pointer hover:opacity-90 transition"
          >
            <Signal size={22} className="text-white" />
            <h1 className="text-lg sm:text-xl font-bold tracking-wide">
              SIMTrackr
            </h1>
          </div>
        </div>

        {/* Right side: User Info + Logout */}
        <div className="flex items-center gap-3">
          {user && (
            <>
              <span className="hidden sm:inline text-sm font-medium">
                Welcome, {user.name}
              </span>
              <div className="hidden sm:flex w-9 h-9 rounded-full bg-white text-blue-600 items-center justify-center font-bold">
                {userInitial}
              </div>
            </>
          )}
          <button
  onClick={handleLogout}
  className="px-3 py-1 bg-red-500 hover:bg-red-600 rounded text-white text-sm transition focus:outline-none focus:ring-0 border-none"
>
  Logout
</button>

        </div>
      </div>
    </header>
  );
}
