import { useState, useEffect } from "react";
import API from "../requests";

export default function History() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchHistory();
  }, []);

  async function fetchHistory() {
    try {
      setLoading(true);
      const res = await API.get("/history");
      if (res.data.success) {
        setHistory(res.data.data);
      }
    } catch (err) {
      console.error("Error fetching history:", err);
      setError("Failed to load search history");
    } finally {
      setLoading(false);
    }
  }

  function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  }

  function handleItemClick(item) {
    setSelectedItem(item);
  }

  function closeModal() {
    setSelectedItem(null);
  }

  function getStatusBadge(status) {
    if (status === "found") {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          Found
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
          ✗ Not Found
        </span>
      );
    }
  }

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <h2 className="text-2xl font-bold mb-4">📜 History</h2>
        <div className="flex items-center justify-center py-12">
          <svg className="animate-spin h-8 w-8 text-blue-600" viewBox="0 0 24 24">
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
          <span className="ml-2 text-gray-600">Loading history...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-4">📜 Search History</h2>
      <p className="mb-6 text-gray-600">See all your past searched numbers with complete details.</p>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {history.length === 0 ? (
        <div className="bg-white shadow rounded-lg p-8 text-center">
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
          <h3 className="mt-2 text-sm font-medium text-gray-900">No searches yet</h3>
          <p className="mt-1 text-sm text-gray-500">
            Start by searching for a phone number
          </p>
        </div>
      ) : (
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Phone Number
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Owner Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Searched By
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date & Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {history.map((item) => (
                  <tr key={item._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {item.phone_number}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {item.status === "found" ? (item.full_name || "N/A") : (
                        <span className="text-red-500 font-medium">Data Not Found</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {getStatusBadge(item.status)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      <div className="flex flex-col">
                        <span className="font-medium text-gray-900">{item.userName || "Unknown"}</span>
                        <span className="text-xs text-gray-400">{item.userEmail || "N/A"}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(item.searchedAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <button
                        onClick={() => handleItemClick(item)}
                        className="text-blue-600 hover:text-blue-900 font-medium"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal for showing details */}
      {selectedItem && (
        <div
          className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50"
          onClick={closeModal}
        >
          <div
            className="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold text-gray-900">
                Search Details
              </h3>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-600 transition"
              >
                <svg
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              {/* Status Badge */}
              <div className="flex justify-between items-center bg-gray-50 p-4 rounded">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Search Status</p>
                  <div className="mt-2">{getStatusBadge(selectedItem.status)}</div>
                </div>
                {selectedItem.status === "not_found" && (
                  <div className="text-right">
                    <p className="text-xs text-red-500 font-medium">
                      {selectedItem.errorMessage || "No data available for this number"}
                    </p>
                  </div>
                )}
              </div>

              {/* User Details */}
              <div className="bg-blue-50 p-4 rounded border border-blue-200">
                <p className="text-sm font-semibold text-blue-900 mb-2">Searched By</p>
                <div className="space-y-1">
                  <p className="text-sm text-blue-800">
                    <span className="font-medium">Name:</span> {selectedItem.userName || "Unknown User"}
                  </p>
                  <p className="text-sm text-blue-800">
                    <span className="font-medium">Email:</span> {selectedItem.userEmail || "N/A"}
                  </p>
                </div>
              </div>

              {/* Phone Number */}
              <div className="bg-gray-50 p-4 rounded">
                <p className="text-sm text-gray-600 mb-1">Phone Number</p>
                <p className="text-lg font-semibold text-gray-900">
                  {selectedItem.phone_number}
                </p>
              </div>

              {selectedItem.status === "found" ? (
                <>
                  {/* Owner Name */}
                  <div className="bg-gray-50 p-4 rounded">
                    <p className="text-sm text-gray-600 mb-1">Owner Name</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {selectedItem.full_name || "N/A"}
                    </p>
                  </div>

                  {/* CNIC */}
                  <div className="bg-gray-50 p-4 rounded">
                    <p className="text-sm text-gray-600 mb-1">CNIC</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {selectedItem.cnic || "N/A"}
                    </p>
                  </div>

                  {/* Address */}
                  <div className="bg-gray-50 p-4 rounded">
                    <p className="text-sm text-gray-600 mb-1">Address</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {selectedItem.address || "N/A"}
                    </p>
                  </div>
                </>
              ) : (
                <div className="bg-red-50 p-6 rounded border border-red-200 text-center">
                  <svg
                    className="mx-auto h-12 w-12 text-red-400 mb-3"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <p className="text-red-800 font-semibold text-lg">
                    No Data Found
                  </p>
                  <p className="text-red-600 text-sm mt-2">
                    The system could not find any information for this phone number.
                  </p>
                </div>
              )}

              {/* Search Details */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 p-4 rounded">
                  <p className="text-sm text-gray-600 mb-1">Search Date</p>
                  <p className="text-sm font-semibold text-gray-900">
                    {formatDate(selectedItem.searchedAt)}
                  </p>
                </div>
{/* 
                <div className="bg-gray-50 p-4 rounded">
                  <p className="text-sm text-gray-600 mb-1">Source</p>
                  <p className="text-sm font-semibold text-gray-900 capitalize">
                    {selectedItem.source || "N/A"}
                  </p>
                </div> */}
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={closeModal}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}