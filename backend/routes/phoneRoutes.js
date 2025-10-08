const express = require("express");
const router = express.Router();
const phoneController = require("../controllers/phoneController");
const { authenticate } = require("../middlewares/auth");

router.get("/lookup/:sim", authenticate, phoneController.lookupSim);

module.exports = router;