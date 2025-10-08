const express = require("express");
const router = express.Router();
const searchPhoneController = require("../controllers/searchPhoneController");
const { authenticate } = require("../middlewares/auth");

router.post("/search-phone", authenticate, searchPhoneController.searchPhone);

module.exports = router;