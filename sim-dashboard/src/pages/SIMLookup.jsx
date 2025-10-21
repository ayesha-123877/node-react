import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import API from "../requests";
import DashboardLayout from "../layouts/DashboardLayout";

export default function SIMLookup() {
  const [sim, setSim] = useState("");
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const querySim = searchParams.get("sim");
    if (querySim) {
      setSim(querySim);
      lookupSim(querySim);
    } else {
      setResult(null);
      setError("");
    }
  }, [searchParams]);

  function handleSubmit(e) {
    e.preventDefault();
    if (!/^\d{11}$/.test(sim)) {
      setError("Please enter a valid 11-digit SIM number.");
      return;
    }
    setError("");
    lookupSim(sim);
  }

  async function lookupSim(simNumber) {
    setLoading(true);
    setError("");
    setResult(null);

    try {
      const token = localStorage.getItem("token");
      const dbRes = await API.get(`/lookup/${simNumber}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (dbRes.data.success && dbRes.data.data) {
        setResult({
          sim: simNumber,
          owner: dbRes.data.data.full_name,
          cnic: dbRes.data.data.cnic,
          address: dbRes.data.data.address,
          source: "database",
        });
        setSim("");
        return;
      }
    } catch {
      console.log("Not found in DB, searching via API...");
    }

    try {
      const token = localStorage.getItem("token");
      const apiRes = await API.post(
        `/search-phone`,
        { phone_number: simNumber },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (apiRes.data.success && apiRes.data.data) {
        setResult({
          sim: simNumber,
          owner: apiRes.data.data.full_name,
          cnic: apiRes.data.data.cnic,
          address: apiRes.data.data.address,
          source: "api",
        });
        setSim("");
      } else {
        setError("Data not found.");
      }
    } catch (err) {
      if (err.response?.status === 401) setError("Unauthorized. Please log in again.");
      else if (err.response?.status === 404) setError("Data not found.");
      else setError("Error fetching number details. Please try again.");
      console.error("Lookup error:", err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
        <h2 className="text-2xl sm:text-3xl font-bold mb-8 text-gray-900 bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 px-6 py-4 rounded-2xl shadow-md border border-blue-200 inline-block">
          SIM Lookup
        </h2>

       <form
  onSubmit={handleSubmit}
  className="flex flex-col sm:flex-row gap-3 max-w-xl mb-8 bg-white p-4 rounded-xl shadow-md border items-center sm:items-stretch"
>

          <input
            type="text"
            value={sim}
            onChange={(e) => setSim(e.target.value)}
            placeholder="Enter Phone number (0300XXXXXXX)"
            className="flex-1 px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700 text-sm sm:text-base"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center text-sm sm:text-base transition"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
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
                Searching...
              </>
            ) : (
              "Search"
            )}
          </button>
        </form>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg shadow-sm text-sm sm:text-base">
            <p className="text-red-600 font-medium">{error}</p>
          </div>
        )}

        {result && !loading && (
          <div className="bg-white shadow-lg rounded-xl border overflow-hidden">
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-4">
              <h3 className="text-lg sm:text-xl font-semibold text-white">
                Search Result
              </h3>
              <p className="text-blue-100 text-xs sm:text-sm mt-1">
                Source: {result.source === "database" ? "Database" : "Live API"}
              </p>
            </div>

            <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-gray-50 p-4 rounded-lg shadow-sm">
                <p className="text-sm text-gray-600 mb-1">SIM Number</p>
                <p className="text-base sm:text-lg font-semibold text-gray-900 break-all">
                  {result.sim}
                </p>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg shadow-sm">
                <p className="text-sm text-gray-600 mb-1">Owner Name</p>
                <p className="text-base sm:text-lg font-semibold text-gray-900">
                  {result.owner || "N/A"}
                </p>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg shadow-sm">
                <p className="text-sm text-gray-600 mb-1">CNIC</p>
                <p className="text-base sm:text-lg font-semibold text-gray-900">
                  {result.cnic || "N/A"}
                </p>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg shadow-sm sm:col-span-2">
                <p className="text-sm text-gray-600 mb-1">Address</p>
                <p className="text-base sm:text-lg font-semibold text-gray-900">
                  {result.address || "N/A"}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
