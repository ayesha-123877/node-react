// src/pages/Register.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AuthLayout from "../layouts/AuthLayout";

const API_URL = "http://localhost:5000/api";

export default function Register() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) navigate("/dashboard");
  }, [navigate]);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch(`${API_URL}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 400) setError(data.message || "Invalid input");
        else if (res.status === 401) setError("Unauthorized. Check credentials.");
        else if (res.status === 500) setError("Server error. Try again later.");
        else setError(data.message || "Something went wrong.");
        return;
      }

      if (data.success) {
        setSuccess("Registration successful! Redirecting...");
        setTimeout(() => navigate("/login"), 1500);
      }
    } catch (err) {
      setError("Network error. Please check your connection.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout title="Create Account">
      <form onSubmit={handleSubmit}>
        {error && (
          <p className="text-red-500 text-sm mb-3 text-center font-medium">
            {error}
          </p>
        )}
        {success && (
          <p className="text-green-500 text-sm mb-3 text-center font-medium">
            {success}
          </p>
        )}

        <input
          type="text"
          placeholder="Full name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none rounded-lg p-3 mb-3 text-sm sm:text-base transition"
          required
        />

        <input
          type="email"
          placeholder="Email address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none rounded-lg p-3 mb-3 text-sm sm:text-base transition"
          required
        />

        <input
          type="password"
          placeholder="Password (min 6 chars)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none rounded-lg p-3 mb-5 text-sm sm:text-base transition"
          required
        />

        <button
          type="submit"
          disabled={loading}
          className={`w-full p-3 rounded-lg text-white text-sm sm:text-base font-semibold shadow-md transition ${
            loading
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-blue-600 hover:bg-blue-700"
          }`}
        >
          {loading ? "Registering..." : "Register"}
        </button>

        <p className="text-center text-sm mt-5 text-gray-600">
          Already have an account?{" "}
          <span
            className="text-blue-600 font-semibold cursor-pointer hover:underline"
            onClick={() => navigate("/login")}
          >
            Login
          </span>
        </p>
      </form>
    </AuthLayout>
  );
}
