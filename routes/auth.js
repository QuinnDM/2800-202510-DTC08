// routes/auth.js

const express = require("express");
const router = express.Router();
const User = require("../models/user");
const bcrypt = require("bcrypt");

// Login page
router.get("/login", (req, res) => {
  res.render("login", {
    title: "Nature Nexus - Login",
    error: null,
    currentPage: "login",
  });
});

// Login submission
router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (user && (await bcrypt.compare(password, user.password))) {
      req.session.user = user;
      res.redirect("/");
    } else {
      res.render("login", {
        title: "Nature Nexus - Login",
        error: "Invalid email or password",
        currentPage: "login",
      });
    }
  } catch (err) {
    console.error("Login error:", err);
    res.render("login", {
      title: "Nature Nexus - Login",
      error: "An error occurred",
      currentPage: "login",
    });
  }
});

// Registration page
router.get("/register", (req, res) => {
  res.render("login", {
    title: "Nature Nexus - Register",
    error: null,
    currentPage: "register",
  });
});

// Registration submission
router.post("/register", async (req, res) => {
  const { email, password } = req.body;
  console.log("Registration attempt:", { email, password: "***" });
  if (!email || !password) {
    console.log("Missing email or password");
    return res.render("login", {
      title: "Nature Nexus - Register",
      error: "Email and password are required",
      currentPage: "register",
    });
  }
  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.log("Email already registered:", email);
      res.render("login", {
        title: "Nature Nexus - Register",
        error: "Email already registered",
        currentPage: "register",
      });
    } else {
      const saltRounds = process.env.SALT_ROUND
        ? parseInt(process.env.SALT_ROUND)
        : 10;
      const hashedPassword = await bcrypt.hash(password, saltRounds);
      console.log("Password hashed successfully");
      const newUser = new User({
        email,
        password: hashedPassword,
        stats: { birds: 0, plants: 0 },
        collections: [],
      });
      const savedUser = await newUser.save();
      console.log("User saved to MongoDB:", savedUser._id);
      res.redirect("/login");
    }
  } catch (err) {
    console.error("Registration error:", err);
    res.render("login", {
      title: "Nature Nexus - Register",
      error: `Registration failed: ${err.message}`,
      currentPage: "register",
    });
  }
});

// Logout
router.get("/logout", (req, res) => {
  req.session.destroy(() => {
    res.redirect("/login");
  });
});

module.exports = router;