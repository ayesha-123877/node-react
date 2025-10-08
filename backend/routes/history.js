const express = require("express");
const router = express.Router();
const historyController = require("../controllers/historyController");
const { authenticate } = require("../middlewares/auth");

router.get("/", authenticate, historyController.getUserHistory);
router.get("/:id", authenticate, historyController.getHistoryItem);
router.delete("/:id", authenticate, historyController.deleteHistoryItem);
router.delete("/", authenticate, historyController.clearAllHistory);

module.exports = router;