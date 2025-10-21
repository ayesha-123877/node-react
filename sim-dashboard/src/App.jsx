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

function App() {
  const [history, setHistory] = useState([]);
  const location = useLocation();

  function handleSearch(newSim) {
    setHistory((prev) => [...prev, newSim]);
  }

  const hideLayout =
    location.pathname === "/login" || location.pathname === "/register";

  return (
    <div className="flex flex-col min-h-screen bg-white">
      {!hideLayout && <Header />}
      {!hideLayout && <Sidebar />}

      <main
        className={
          !hideLayout ? "flex-1 ml-64 pt-14 p-6 bg-white" : "flex-1"
        }
      >
        <Routes>
          {/* Public */}
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />

          {/* Protected */}
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
        </Routes>
      </main>

      {!hideLayout && <Footer />}
    </div>
  );
}

export default App;
