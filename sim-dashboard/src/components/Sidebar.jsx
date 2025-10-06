// src/components/Sidebar.jsx
import { Link, useLocation } from "react-router-dom";

export default function Sidebar() {
  const location = useLocation();

  const links = [
    { to: "/dashboard", label: " Dashboard" },
    { to: "/simlookup", label: " SIM Lookup" },
    // { to: "/cniclookup", label: " CNIC Lookup" },
    { to: "/history", label: " History" },
    { to: "/settings", label: " Settings" },
  ];

  return (
    <aside className="w-64 bg-gray-100 border-r p-4 pt-20 fixed top-0 left-0 h-full overflow-y-auto">
      <nav className="flex flex-col gap-2">
        {links.map((link) => (
          <Link
            key={link.to}
            to={link.to}
            className={`p-2 rounded ${
              location.pathname === link.to
                ? "bg-blue-600 text-white"
                : "hover:bg-gray-200"
            }`}
          >
            {link.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
