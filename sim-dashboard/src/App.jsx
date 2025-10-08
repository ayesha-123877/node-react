// src/App.jsx
import { useState } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import Header from "./components/Header";
import Sidebar from "./components/Sidebar";
import Footer from "./components/Footer";
import ProtectedRoute from "./components/ProtectedRoute";

// Pages
import Register from "./pages/Register";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import SIMLookup from "./pages/SIMLookup";
import History from "./pages/History";

import Settings from "./pages/Settings";

function App() {
  const [history, setHistory] = useState([]);
  const location = useLocation();

  function handleSearch(newSim) {
    setHistory((prev) => [...prev, newSim]);
  }

  // check if we are on login/register page
  const hideLayout =
    location.pathname === "/login" || location.pathname === "/register";

  return (
    <div>
      {/* Show header + sidebar only if NOT login/register */}
      {!hideLayout && <Header />}
      {!hideLayout && <Sidebar />}

      <main
        className={
          !hideLayout ? "ml-64 pt-14 p-6 bg-white min-h-screen" : "min-h-screen"
        }
      >
        <Routes>
          {/* Public routes */}
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />

          {/* Protected routes */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/simlookup"
            element={
              <ProtectedRoute>
                <SIMLookup onSearch={handleSearch} />
              </ProtectedRoute>
            }
          />

          <Route
            path="/history"
            element={
              <ProtectedRoute>
                <History history={history} />
              </ProtectedRoute>
            }
          />
          
          
          
          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <Settings />
              </ProtectedRoute>
            }
          />
        </Routes>
      </main>

      {/* Footer only if NOT login/register */}
      {!hideLayout && <Footer />}
    </div>
  );
}

export default App;
