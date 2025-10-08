const { validationResult } = require('express-validator');
const User = require("../models/User");
const { generateToken } = require("../middlewares/auth");

// Register new user
exports.register = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: errors.array()
      });
    }

    const { name, email, password } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "Email already registered. Please login instead."
      });
    }

    const user = await User.create({
      name,
      email,
      password
    });

    const token = generateToken(user._id);

    console.log(` New user registered: ${email}`);

    res.status(201).json({
      success: true,
      message: "Registration successful!",
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role
        },
        token
      }
    });

  } catch (error) {
    console.error(" Registration error:", error);
    res.status(500).json({
      success: false,
      message: "Registration failed. Please try again.",
      error: error.message
    });
  }
};

// Login user
exports.login = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: errors.array()
      });
    }

    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password"
      });
    }

    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: "Your account has been deactivated. Please contact support."
      });
    }

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password"
      });
    }

    user.lastLogin = new Date();
    await user.save();

    const token = generateToken(user._id);

    console.log(` User logged in: ${email}`);

    res.json({
      success: true,
      message: "Login successful!",
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role
        },
        token
      }
    });

  } catch (error) {
    console.error(" Login error:", error);
    res.status(500).json({
      success: false,
      message: "Login failed. Please try again."
    });
  }
};

// Get current user profile
exports.getCurrentUser = async (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        user: req.user
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch user profile"
    });
  }
};

// Logout user
exports.logout = async (req, res) => {
  try {
    console.log(` User logged out: ${req.user.email}`);
    
    res.json({
      success: true,
      message: "Logged out successfully"
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Logout failed"
    });
  }
};