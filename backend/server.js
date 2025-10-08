// ====== IMPORTS ======
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require('dotenv').config();

// ====== ROUTES ======
const authRoutes = require("./routes/auth");
const phoneRoutes = require("./routes/phoneRoutes");
const searchPhoneRoutes = require("./routes/searchPhone");
const historyRoutes = require("./routes/history");
const adminRoutes = require("./routes/admin");
const dashboardStatsRoutes = require("./routes/dashboardStats");

// ====== SERVICES ======
const { initBrowser, closeBrowser } = require("./services/puppeteerService");
const { processNumbers } = require("./jobs/processNumbers");

// ====== APP SETUP ======
const app = express();
app.use(cors());
app.use(express.json());

// ====== DATABASE CONNECTION ======
const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/phone_api_db";
mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log(" MongoDB connected successfully");
  })
  .catch((err) => console.error("MongoDB connection error:", err));

// ====== ROUTES SETUP ======
app.use("/api/auth", authRoutes);
app.use("/api", phoneRoutes);
app.use("/api", searchPhoneRoutes);
app.use("/api/history", historyRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/dashboard", dashboardStatsRoutes);

// ====== CLEANUP ON EXIT ======
process.on('SIGINT', async () => {
  await closeBrowser();
  await mongoose.connection.close();
  console.log(' Server shutdown complete');
  process.exit(0);
});

// ====== START SERVER ======
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, async () => {
  console.log(` Server running on http://localhost:${PORT}`);
  console.log(" SIM Tracker API with Authentication\n");
  
  if (mongoose.connection.readyState === 1) {
    console.log(" MongoDB is ready\n");
  }
  
  // Initialize browser
  await initBrowser();
  
  // Start background job
  console.log(" Starting automated number processing...");
  processNumbers().catch(err => {
    console.error(" Error in processNumbers:", err);
  });
});

module.exports = server;