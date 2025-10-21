import { useState, useEffect } from "react";
import API from "../requests";
import DashboardLayout from "../layouts/DashboardLayout";

export default function History() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchHistory();
  }, []);

  async function fetchHistory() {
    try {
      setLoading(true);
      const res = await API.get("/history");
      if (res.data.success) setHistory(res.data.data);
    } catch (err) {
      console.error("Error fetching history:", err);
      setError("Failed to load search history");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id) {
    const confirmDelete = window.confirm("Are you sure you want to delete this record?");
    if (!confirmDelete) return;
    try {
      await API.delete(`/history/${id}`);
      setHistory((prev) => prev.filter((item) => item._id !== id));
    } catch (err) {
      console.error("Delete failed:", err);
      alert("Something went wrong while deleting. Please try again.");
    }
  }

  async function handleClearAll() {
    const confirmClear = window.confirm("Are you sure you want to clear your entire search history?");
    if (!confirmClear) return;
    try {
      await API.delete("/history/clear");
      setHistory([]);
      alert("All history cleared successfully!");
    } catch (err) {
      console.error("Clear history failed:", err);
      alert("Something went wrong while clearing history. Please try again.");
    }
  }

  function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function getStatusBadge(status) {
    const baseClasses =
      "inline-flex items-center justify-center px-3 py-1 rounded-full text-xs font-medium w-20 text-center";
    return status === "found" ? (
      <span className={`${baseClasses} bg-green-100 text-green-800`}>
        Found
      </span>
    ) : (
      <span className={`${baseClasses} bg-red-100 text-red-800`}>
        Not Found
      </span>
    );
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="max-w-6xl mx-auto p-8">
          <h2 className="text-3xl font-bold mb-6 text-gray-900 bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 px-8 py-4 rounded-2xl shadow-md border border-blue-200 inline-block">
            Search History
          </h2>
          <div className="flex items-center justify-center py-12">
            <svg
              className="animate-spin h-8 w-8 text-blue-600"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
                fill="none"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            <span className="ml-3 text-gray-600 font-medium">Loading history...</span>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto p-4 sm:p-8">
        {/* Heading + Clear All */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 px-6 py-3 rounded-2xl shadow-md border border-blue-200 inline-block">
            Search History
          </h2>
          {history.length > 0 && (
            <button
              onClick={handleClearAll}
              className="mt-4 sm:mt-0 bg-red-600 hover:bg-red-700 text-white px-5 py-2 rounded-lg text-sm font-medium shadow transition"
            >
              Clear All History
            </button>
          )}
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg shadow-sm">
            <p className="text-red-600 font-medium">{error}</p>
          </div>
        )}

        {history.length === 0 ? (
          <div className="bg-white shadow rounded-lg p-10 text-center">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <h3 className="mt-3 text-lg font-semibold text-gray-900">
              No searches yet
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Start by searching for a phone number.
            </p>
          </div>
        ) : (
          <div className="bg-white shadow-lg rounded-lg overflow-hidden border">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-100">
                  <tr>
                    {["Phone Number", "Owner Name", "Status", "Searched By", "Date & Time", "Action"].map(
                      (header) => (
                        <th
                          key={header}
                          className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap"
                        >
                          {header}
                        </th>
                      )
                    )}
                  </tr>
                </thead>

                <tbody className="bg-white divide-y divide-gray-200 text-sm">
                  {history.map((item) => (
                    <tr key={item._id} className="hover:bg-gray-50 transition">
                      <td className="px-4 sm:px-6 py-4 text-gray-900">{item.phone_number}</td>
                      <td className="px-4 sm:px-6 py-4 text-gray-700">
                        {item.status === "found" ? (
                          item.full_name || "N/A"
                        ) : (
                          <span className="text-gray-700 font-medium">Data Not Found</span>
                        )}
                      </td>
                      <td className="px-4 sm:px-6 py-4">{getStatusBadge(item.status)}</td>
                      <td className="px-4 sm:px-6 py-4 text-gray-700">
                        <div className="flex flex-col">
                          <span className="font-medium text-gray-900">{item.userName || "Unknown"}</span>
                          <span className="text-xs text-gray-400">{item.userEmail || "N/A"}</span>
                        </div>
                      </td>
                      <td className="px-4 sm:px-6 py-4 text-gray-500 whitespace-nowrap">
                        {formatDate(item.searchedAt)}
                      </td>
                      <td className="px-4 sm:px-6 py-4">
                        <button
                          onClick={() => handleDelete(item._id)}
                          className="text-red-600 hover:text-red-800 font-medium"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
