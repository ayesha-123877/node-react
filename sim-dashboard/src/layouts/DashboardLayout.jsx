import { useState } from "react";
import Header from "../components/Header";
import Sidebar from "../components/Sidebar";

export default function DashboardLayout({ children }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      {/* Main section */}
      <div className="flex flex-col flex-1 min-h-screen w-full">
        {/* Header */}
        <Header onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />

        {/* Content area */}
        <main
          className={`flex-1 p-4 sm:p-6 lg:p-8 pt-20 transition-all duration-300 w-full ${
            isSidebarOpen ? "sm:ml-64" : "sm:ml-0"
          }`}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
