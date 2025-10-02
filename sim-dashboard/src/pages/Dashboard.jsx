// src/pages/Dashboard.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Dashboard() {
  const [recent, setRecent] = useState([]);
  const navigate = useNavigate();

  // quick lookup form
  function handleQuickLookup(e) {
    e.preventDefault();
    const sim = e.target.sim.value.trim();
    if (!/^\d{11}$/.test(sim)) {
      alert("Please enter a valid 11-digit SIM number.");
      return;
    }
    setRecent([sim, ...recent.slice(0, 4)]); // store max 5
    navigate(`/simlookup?sim=${sim}`); // redirect to SIM lookup page
  }

  return (
    <main className="p-6 pt-20">
      <h2 className="text-2xl font-bold mb-4">📊 Dashboard</h2>

      {/* Quick SIM Lookup form */}
      <form
        onSubmit={handleQuickLookup}
        className="flex gap-2 max-w-lg mb-6"
      >
        <input
          type="text"
          name="sim"
          placeholder="Enter SIM number (0300XXXXXXX)"
          className="flex-1 px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Search
        </button>
      </form>

      {/* Stats cards (Reports removed) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
        <div className="bg-blue-600 text-white p-6 rounded-xl shadow">
          <h3 className="text-lg font-semibold">🔎 SIM Lookups</h3>
          <p className="text-2xl font-bold">152</p>
        </div>
        <div className="bg-green-600 text-white p-6 rounded-xl shadow">
          <h3 className="text-lg font-semibold">📅 Today’s Searches</h3>
          <p className="text-2xl font-bold">12</p>
        </div>
        <div className="bg-purple-600 text-white p-6 rounded-xl shadow">
          <h3 className="text-lg font-semibold">🪪 CNIC Records</h3>
          <p className="text-2xl font-bold">98</p>
        </div>
      </div>

      {/* Recent searches */}
      <div className="bg-white shadow rounded-lg p-4 mb-6">
        <h3 className="text-lg font-semibold mb-2">Recent Searches</h3>
        {recent.length === 0 ? (
          <p className="text-gray-500">No recent searches.</p>
        ) : (
          <ul className="list-disc pl-6">
            {recent.map((sim, i) => (
              <li key={i}>{sim}</li>
            ))}
          </ul>
        )}
      </div>

      {/* Quick Actions (Generate Report removed) */}
      <div className="bg-white shadow rounded-lg p-4 flex flex-col gap-4">
        <h3 className="text-lg font-semibold">Quick Actions</h3>
        <div className="flex gap-4">
          <button
            onClick={() => navigate("/simlookup")}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Go to SIM Lookup
          </button>
        </div>
      </div>
    </main>
  );
}
