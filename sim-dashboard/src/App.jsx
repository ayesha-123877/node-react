// src/App.jsx
import { useState } from "react";
import { Routes, Route } from "react-router-dom";
import Header from "./components/Header";
import Sidebar from "./components/Sidebar";
import Footer from "./components/Footer";

// Pages
import Dashboard from "./pages/Dashboard";
import SIMLookup from "./pages/SIMLookup";
import CNICLookup from "./pages/CNICLookup";
import History from "./pages/History";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";

function App() {
  // 🆕 shared history state
  const [history, setHistory] = useState([]);

  function handleSearch(newSim) {
    setHistory((prev) => [...prev, newSim]);
  }

  return (
    <div>
      {/* Fixed Header */}
      <Header />
      {/* Fixed Sidebar */}
      <Sidebar />

      {/* Main content area */}
      <main className="ml-64 pt-14 p-6 bg-white min-h-screen">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/dashboard" element={<Dashboard />} />
          
          {/* pass handleSearch into SIMLookup */}
          <Route path="/simlookup" element={<SIMLookup onSearch={handleSearch} />} />

          <Route path="/cniclookup" element={<CNICLookup />} />
          
          {/* pass history into History */}
          <Route path="/history" element={<History history={history} />} />

          <Route path="/reports" element={<Reports />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </main>

      <Footer />
    </div>
  );
}

export default App;
