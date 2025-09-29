import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";

export default function SIMLookup({ onSearch }) {
  const [sim, setSim] = useState("");
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const querySim = searchParams.get("sim");
    if (querySim) {
      setSim(querySim);
      fakeLookup(querySim);
    }
  }, [searchParams]);

  function handleSubmit(e) {
    e.preventDefault();
    if (!/^\d{11}$/.test(sim)) {
      setError("Please enter a valid 11-digit SIM number.");
      setResult(null);
      return;
    }
    setError("");
    fakeLookup(sim);

    // save search to parent history
    onSearch(sim);
  }

  function fakeLookup(sim) {
    setResult({
      sim,
      owner: "Ali Khan",
      cnic: "35202-1234567-8",
      operator: "Jazz",
      status: "Active",
    });
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

      {result && (
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-xl font-semibold mb-4">SIM Details</h3>
          <p><strong>SIM:</strong> {result.sim}</p>
          <p><strong>Owner:</strong> {result.owner}</p>
          <p><strong>CNIC:</strong> {result.cnic}</p>
          <p><strong>Operator:</strong> {result.operator}</p>
          <p><strong>Status:</strong> {result.status}</p>
        </div>
      )}
    </div>
  );
}
