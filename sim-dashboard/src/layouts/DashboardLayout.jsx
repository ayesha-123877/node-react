import { useState } from "react";
import Header from "../components/Header";
import Sidebar from "../components/Sidebar";

export default function DashboardLayout({ children }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Sidebar */}
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      {/* Main content area */}
      <div className="flex flex-col flex-1 min-h-screen w-full transition-all duration-300">
        {/* Header */}
        <Header onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />

        {/* Page Content */}
        <main
          className={`flex-1 w-full transition-all duration-300 pt-20 px-4 sm:px-6 lg:px-8 ${
            isSidebarOpen ? "sm:ml-64" : "sm:ml-0"
          }`}
        >
          <div className="max-w-7xl mx-auto w-full">{children}</div>
        </main>
      </div>
    </div>
  );
}
