// ====== IMPORTS ======
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

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

// ====== ROUTES SETUP ======
app.use("/api/auth", authRoutes);
app.use("/api", phoneRoutes);
app.use("/api", searchPhoneRoutes);
app.use("/api/history", historyRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/dashboard", dashboardStatsRoutes);

// ====== DATABASE CONNECTION ======
const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/phone_api_db";
const PORT = process.env.PORT || 5000;

// ====== START FUNCTION ======
async function startServer() {
  try {
    // Connect to MongoDB first
    await mongoose.connect(MONGO_URI);
    console.log(" MongoDB connected successfully");

    // Start Express server only after DB is ready
    const server = app.listen(PORT, async () => {
      console.log(` Server running on http://localhost:${PORT}`);
      console.log("SIM Tracker API with Authentication\n");

      // Initialize Puppeteer Browser
      await initBrowser();

      // Start background job
      console.log("Starting automated number processing...");
      processNumbers().catch((err) => console.error(" Error in processNumbers:", err));
    });

    // ====== CLEANUP ON EXIT ======
    process.on("SIGINT", async () => {
      console.log("\n Shutting down server...");
      await closeBrowser();
      await mongoose.connection.close();
      server.close(() => {
        console.log(" Server shutdown complete");
        process.exit(0);
      });
    });

  } catch (err) {
    console.error(" Failed to start server:", err);
    process.exit(1); // Stop app if DB connection fails
  }
}

// ====== RUN APP ======
startServer();
