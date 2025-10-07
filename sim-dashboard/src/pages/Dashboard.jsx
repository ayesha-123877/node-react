// src/pages/Dashboard.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import API from "../requests";
import { Search, CalendarDays, BarChart3 } from "lucide-react"; 

export default function Dashboard() {
  const [totalLookups, setTotalLookups] = useState(0);
  const [todaysSearches, setTodaysSearches] = useState(0);
  const [userTotalSearches, setUserTotalSearches] = useState(0);
  const navigate = useNavigate();

  async function fetchStats() {
    try {
      const res = await API.get("/dashboard/stats");
      if (res.data.success) {
        setTotalLookups(res.data.data.totalLookups);
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
    <main className="p-8 pt-16 bg-gray-50 min-h-screen">
      <h2 className="text-3xl font-bold mb-10 text-gray-900 bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 px-8 py-4 rounded-2xl shadow-md border border-blue-200 inline-block">
        Dashboard
      </h2>

      {/* Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
        {/* Total SIM Lookups */}
        <div className="bg-gradient-to-r from-blue-500 to-blue-700 text-white p-8 rounded-2xl shadow-lg border border-blue-200 hover:scale-105 transition-transform">
          <div className="flex items-center gap-3 mb-3">
            <Search size={28} className="text-white" />
            <h3 className="text-lg font-semibold">Total SIM Lookups</h3>
          </div>
          <p className="text-4xl font-bold">{totalLookups}</p>
          <p className="text-sm mt-2 opacity-80">System-wide</p>
        </div>

        {/* Today's Searches */}
        <div className="bg-gradient-to-r from-green-500 to-green-700 text-white p-8 rounded-2xl shadow-lg border border-green-200 hover:scale-105 transition-transform">
          <div className="flex items-center gap-3 mb-3">
            <CalendarDays size={28} className="text-white" />
            <h3 className="text-lg font-semibold">Today's Searches</h3>
          </div>
          <p className="text-4xl font-bold">{todaysSearches}</p>
          <p className="text-sm mt-2 opacity-80">Your searches today</p>
        </div>

        {/* Your Total Searches */}
        <div className="bg-gradient-to-r from-purple-500 to-purple-700 text-white p-8 rounded-2xl shadow-lg border border-purple-200 hover:scale-105 transition-transform">
          <div className="flex items-center gap-3 mb-3">
            <BarChart3 size={28} className="text-white" />
            <h3 className="text-lg font-semibold">Your Total Searches</h3>
          </div>
          <p className="text-4xl font-bold">{userTotalSearches}</p>
          <p className="text-sm mt-2 opacity-80">All time</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white shadow-md rounded-2xl p-8 border border-gray-200">
        <h3 className="text-2xl font-semibold mb-6 text-gray-900 bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 px-6 py-3 rounded-2xl shadow-md border border-blue-200 inline-block">
          Quick Actions
        </h3>

        <div className="flex gap-4">
          <button
            onClick={() => navigate("/simlookup")}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow transition"
          >
            Go to SIM Lookup
          </button>
          <button
            onClick={() => navigate("/history")}
            className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 shadow transition"
          >
            View Search History
          </button>
        </div>
      </div>
    </main>
  );
}
