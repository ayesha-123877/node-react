import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import API from "../requests";

export default function SIMLookup({ onSearch }) {
  const [sim, setSim] = useState("");
  // ❌ Remove this unused state
  // const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [searchParams] = useSearchParams();
  const [history, setHistory] = useState([]);

  useEffect(() => {
    const querySim = searchParams.get("sim");
    if (querySim) {
      setSim(querySim);
      lookupSim(querySim);
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

    if (onSearch) onSearch(sim);
  }

  async function lookupSim(sim) {
    try {
      const res = await API.get(`/lookup/${sim}`);
      if (res.data.success) {
        setError("");
        setHistory((prev) => [...prev, res.data]);
        setSim("");
      } else {
        setError("Number not found in database.");
      }
    } catch (err) {
      if (err.response?.status === 404) {
        setError("Number not found in database.");
      } else {
        setError("Error fetching number details.");
      }
    }
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">🔎 SIM Lookup</h2>
      <form onSubmit={handleSubmit} className="flex gap-2 max-w-lg mb-6">
        <input
          type="text"
          value={sim}
          onChange={(e) => setSim(e.target.value)}
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

      {error && <p className="text-red-500 mb-4">{error}</p>}

      {history.length > 0 && (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white shadow rounded-lg border">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-2 border">SIM</th>
                <th className="px-4 py-2 border">Owner</th>
                <th className="px-4 py-2 border">CNIC</th>
                <th className="px-4 py-2 border">Address</th>
                <th className="px-4 py-2 border">Status</th>
              </tr>
            </thead>
            <tbody>
              {history.map((item, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-4 py-2 border">{item.sim}</td>
                  <td className="px-4 py-2 border">{item.owner}</td>
                  <td className="px-4 py-2 border">{item.cnic}</td>
                  <td className="px-4 py-2 border">{item.address}</td>
                  <td className="px-4 py-2 border">{item.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}