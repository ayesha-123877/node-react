// src/pages/Dashboard.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import API from "../requests"; // axios instance

export default function Dashboard() {
  const [totalLookups, setTotalLookups] = useState(0);
  const [todaysSearches, setTodaysSearches] = useState(0);
  const navigate = useNavigate();

  async function fetchStats() {
    try {
      const res = await API.get("/dashboard/stats");
      if (res.data.success) {
        setTotalLookups(res.data.data.totalLookups);
        setTodaysSearches(res.data.data.todaysSearches);
      }
    } catch (err) {
      console.error("Failed to fetch stats:", err);
    }
  }

  useEffect(() => {
    fetchStats();
  }, []);

  return (
    <main className="p-8 pt-20 bg-gray-50 min-h-screen">
      {/* Dashboard Heading */}
      <h2 className="text-3xl font-bold mb-10 text-gray-800 border-l-8 border-blue-600 pl-4 py-2 bg-white shadow-sm rounded-r-lg inline-block">
         Dashboard
      </h2>

      {/* Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
        <div className="bg-gradient-to-r from-blue-500 to-blue-700 text-white p-8 rounded-2xl shadow-lg border border-blue-200 hover:scale-105 transition-transform">
          <h3 className="text-lg font-semibold mb-2">🔎 SIM Lookups</h3>
          <p className="text-4xl font-bold">{totalLookups}</p>
        </div>
        <div className="bg-gradient-to-r from-green-500 to-green-700 text-white p-8 rounded-2xl shadow-lg border border-green-200 hover:scale-105 transition-transform">
          <h3 className="text-lg font-semibold mb-2">📅 Today’s Searches</h3>
          <p className="text-4xl font-bold">{todaysSearches}</p>
        </div>
        <div className="bg-gradient-to-r from-purple-500 to-purple-700 text-white p-8 rounded-2xl shadow-lg border border-purple-200 hover:scale-105 transition-transform">
          <h3 className="text-lg font-semibold mb-2">🪪 CNIC Records</h3>
          <p className="text-4xl font-bold">98</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white shadow-md rounded-2xl p-8 border border-gray-200">
        <h3 className="text-xl font-semibold mb-4 text-gray-800 border-l-4 border-blue-500 pl-3">
           Quick Actions
        </h3>
        <div className="flex gap-4">
          <button
            onClick={() => navigate("/simlookup")}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow transition"
          >
            Go to SIM Lookup
          </button>
        </div>
      </div>
    </main>
  );
}
