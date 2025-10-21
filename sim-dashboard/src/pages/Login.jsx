// src/pages/Login.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import API from "../requests";
import AuthLayout from "../layouts/AuthLayout";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) navigate("/dashboard");
  }, [navigate]);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await API.post("/auth/login", { email, password });

      if (res.data.success) {
        localStorage.setItem("token", res.data.data.token);
        localStorage.setItem(
          "user",
          JSON.stringify({
            name: res.data.data.user.name,
            email: res.data.data.user.email,
          })
        );
        navigate("/dashboard");
      } else {
        setError(res.data.message || "Invalid credentials");
      }
    } catch (err) {
      if (err.response) {
        if (err.response.status === 400) setError("Invalid input");
        else if (err.response.status === 401) setError("Incorrect email or password");
        else if (err.response.status === 500) setError("Server error. Try again later.");
        else setError("Something went wrong.");
      } else setError("Network error. Check your connection.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout title="SIMTrackr Login">
      <form onSubmit={handleSubmit}>
        {error && (
          <p className="text-red-500 text-sm mb-4 text-center font-medium">
            {error}
          </p>
        )}

        <input
          type="email"
          placeholder="Email address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none rounded-lg p-3 mb-4 text-sm sm:text-base transition"
          required
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none rounded-lg p-3 mb-6 text-sm sm:text-base transition"
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
          {loading ? "Logging in..." : "Login"}
        </button>

        <p className="text-center text-sm mt-5 text-gray-600">
          Don’t have an account?{" "}
          <span
            className="text-blue-600 font-semibold cursor-pointer hover:underline"
            onClick={() => navigate("/register")}
          >
            Register
          </span>
        </p>
      </form>
    </AuthLayout>
  );
}
