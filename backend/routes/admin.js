const express = require("express");
const router = express.Router();
const adminController = require("../controllers/adminController");
const { authenticate, isAdmin } = require("../middlewares/auth");

router.get("/users", authenticate, isAdmin, adminController.getAllUsers);
router.get("/all-history", authenticate, isAdmin, adminController.getAllHistory);
router.get("/stats", authenticate, isAdmin, adminController.getStats);

module.exports = router;