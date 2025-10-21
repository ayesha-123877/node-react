import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, Phone, History, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function Sidebar({ isOpen, onClose }) {
  const location = useLocation();

  const links = [
    { to: "/dashboard", label: "Dashboard", icon: <LayoutDashboard size={18} /> },
    { to: "/simlookup", label: "SIM Lookup", icon: <Phone size={18} /> },
    { to: "/history", label: "History", icon: <History size={18} /> },
  ];

  return (
    <>
      {/* MOBILE SIDEBAR + OVERLAY */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              className="fixed inset-0 bg-black/40 z-40 sm:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={onClose}
            />

            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "tween", duration: 0.25 }}
              className="fixed top-0 left-0 h-full bg-gray-100 border-r p-4 pt-20 w-64 z-50 sm:hidden"
            >
              <button
                onClick={onClose}
                className="absolute top-4 right-4 text-gray-600 hover:text-gray-800"
              >
                <X size={20} />
              </button>

              <nav className="flex flex-col gap-2 mt-4">
                {links.map((link) => (
                  <Link
                    key={link.to}
                    to={link.to}
                    onClick={onClose}
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
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* DESKTOP SIDEBAR (always visible) */}
      <aside className="hidden sm:flex sm:flex-col sm:w-64 sm:fixed sm:top-0 sm:left-0 sm:h-full sm:bg-gray-100 sm:border-r sm:p-4 sm:pt-20">
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
    </>
  );
}
