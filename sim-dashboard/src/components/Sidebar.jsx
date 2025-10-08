// src/components/Sidebar.jsx
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Phone,
  History,
  
} from "lucide-react";

export default function Sidebar() {
  const location = useLocation();

  const links = [
    { to: "/dashboard", label: "Dashboard", icon: <LayoutDashboard size={18} /> },
    { to: "/simlookup", label: "SIM Lookup", icon: <Phone size={18} /> },
    // { to: "/cniclookup", label: "CNIC Lookup", icon: <IdCard size={18} /> }, // if you ever add CNIC lookup
    { to: "/history", label: "History", icon: <History size={18} /> },
    
  ];

  return (
    <aside className="w-64 bg-gray-100 border-r p-4 pt-20 fixed top-0 left-0 h-full overflow-y-auto">
      <nav className="flex flex-col gap-2">
        {links.map((link) => (
          <Link
            key={link.to}
            to={link.to}
            className={`flex items-center gap-3 p-2 rounded-md font-medium transition-all ${
              location.pathname === link.to
                ? "bg-blue-600 text-white shadow-sm"
                : "text-gray-700 hover:bg-blue-50 hover:text-blue-600"
            }`}
          >
            {link.icon}
            <span>{link.label}</span>
          </Link>
        ))}
      </nav>
    </aside>
  );
}
