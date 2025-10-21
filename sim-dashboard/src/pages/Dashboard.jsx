import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import API from "../requests";
import { CalendarDays, BarChart3 } from "lucide-react";
import DashboardLayout from "../layouts/DashboardLayout";

export default function Dashboard() {
  const [todaysSearches, setTodaysSearches] = useState(0);
  const [userTotalSearches, setUserTotalSearches] = useState(0);
  const navigate = useNavigate();

  async function fetchStats() {
    try {
      const res = await API.get("/dashboard/stats");
      if (res.data.success) {
        setTodaysSearches(res.data.data.todaysSearches);
        setUserTotalSearches(res.data.data.userTotalSearches);
      }
    } catch (err) {
      console.error("Failed to fetch stats:", err);
    }
  }

  useEffect(() => {
    fetchStats();
  }, []);

  return (
    <DashboardLayout>
      <div className="bg-gray-50 min-h-screen">
        {/* Page Heading */}
        <h2 className="text-2xl sm:text-3xl font-bold mb-6 sm:mb-10 text-gray-900 bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 px-4 sm:px-6 lg:px-8 py-3 sm:py-4 rounded-xl sm:rounded-2xl shadow-md border border-blue-200 inline-block w-full sm:w-auto text-center sm:text-left">
          Dashboard
        </h2>

        {/* Stats Section */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 lg:gap-8 mb-8 sm:mb-12">
          {/* Today's Searches */}
          <div className="bg-gradient-to-r from-green-500 to-green-700 text-white p-5 sm:p-8 rounded-xl sm:rounded-2xl shadow-lg hover:scale-[1.02] transition-transform">
            <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
              <CalendarDays size={24} className="sm:w-7 sm:h-7 text-white flex-shrink-0" />
              <h3 className="text-base sm:text-lg font-semibold">Today's Searches</h3>
            </div>
            <p className="text-3xl sm:text-4xl font-bold">{todaysSearches}</p>
            <p className="text-xs sm:text-sm mt-1 sm:mt-2 opacity-80">Your searches today</p>
          </div>

          {/* Total Searches */}
          <div className="bg-gradient-to-r from-purple-500 to-purple-700 text-white p-5 sm:p-8 rounded-xl sm:rounded-2xl shadow-lg hover:scale-[1.02] transition-transform">
            <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
              <BarChart3 size={24} className="sm:w-7 sm:h-7 text-white flex-shrink-0" />
              <h3 className="text-base sm:text-lg font-semibold">Your Total Searches</h3>
            </div>
            <p className="text-3xl sm:text-4xl font-bold">{userTotalSearches}</p>
            <p className="text-xs sm:text-sm mt-1 sm:mt-2 opacity-80">All time</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white shadow-md rounded-xl sm:rounded-2xl p-4 sm:p-6 lg:p-8 border border-gray-200">
          <h3 className="text-xl sm:text-2xl font-semibold mb-4 sm:mb-6 text-gray-900 bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 px-4 sm:px-6 py-2 sm:py-3 rounded-xl sm:rounded-2xl shadow-md border border-blue-200 inline-block w-full sm:w-auto text-center sm:text-left">
            Quick Actions
          </h3>

          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <button
              onClick={() => navigate("/simlookup")}
              className="w-full sm:w-auto px-4 sm:px-6 py-2.5 sm:py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow transition text-sm sm:text-base font-medium"
            >
              Go to SIM Lookup
            </button>
            <button
              onClick={() => navigate("/history")}
              className="w-full sm:w-auto px-4 sm:px-6 py-2.5 sm:py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 shadow transition text-sm sm:text-base font-medium"
            >
              View Search History
            </button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
