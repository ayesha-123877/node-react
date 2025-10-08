const express = require("express");
const router = express.Router();
const { body } = require('express-validator');
const authController = require("../controllers/authController");
const { authenticate } = require("../middlewares/auth");

router.post("/register", [
  body("name").trim().isLength({ min: 3, max: 50 }),
  body("email").isEmail().normalizeEmail(),
  body("password").isLength({ min: 6 })
], authController.register);

router.post("/login", [
  body("email").isEmail().normalizeEmail(),
  body("password").notEmpty()
], authController.login);

router.get("/me", authenticate, authController.getCurrentUser);
router.post("/logout", authenticate, authController.logout);

module.exports = router;