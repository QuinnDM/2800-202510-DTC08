const express = require("express");
const router = express.Router();
const User = require("../models/user");
const bcrypt = require("bcrypt");
const crypto = require("crypto");

// Login page
router.get("/login", (req, res) => {
  // Check for password reset success message
  const passwordResetSuccess = req.session.passwordResetSuccess;

  // Clear the session variable after use
  if (passwordResetSuccess) {
    delete req.session.passwordResetSuccess;
  }

  res.render("login", {
    title: "Nature Nexus - Login",
    error: passwordResetSuccess
      ? "Your password has been reset successfully. Please login with your new password."
      : null,
    success: passwordResetSuccess ? true : false,
    currentPage: "login",
  });
});

// Login submission with Remember Me functionality
router.post("/login", async (req, res) => {
  const { email, password, remember_me } = req.body;
  try {
    const user = await User.findOne({ email });
    if (user && (await bcrypt.compare(password, user.password))) {
      // Update last login time
      user.lastLoginAt = new Date();

      // Handle remember me functionality
      if (remember_me === "on") {
        // Generate a secure random token
        const token = crypto.randomBytes(32).toString("hex");

        // Set token expiry (30 days from now)
        const tokenExpiry = new Date();
        tokenExpiry.setDate(tokenExpiry.getDate() + 30);

        // Save token to user model
        user.rememberToken = token;
        user.rememberTokenExpiresAt = tokenExpiry;

        // Set a remember me cookie
        res.cookie("remember_token", token, {
          maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
        });

        console.log("Remember me token set for user:", user.email);
      } else {
        // Clear any existing remember token
        user.rememberToken = null;
        user.rememberTokenExpiresAt = null;
        res.clearCookie("remember_token");
      }

      await user.save();

      // Set session
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

// Registration submission with username field
router.post("/register", async (req, res) => {
  const { email, username, password, confirmPassword } = req.body;
  console.log("Registration attempt:", { email, username, password: "***" });

  // Input validation
  if (!email || !password) {
    console.log("Missing email or password");
    return res.render("login", {
      title: "Nature Nexus - Register",
      error: "Email and password are required",
      currentPage: "register",
    });
  }

  if (password !== confirmPassword) {
    console.log("Passwords do not match");
    return res.render("login", {
      title: "Nature Nexus - Register",
      error: "Passwords do not match",
      currentPage: "register",
    });
  }

  try {
    // Check if email already exists
    const existingEmail = await User.findOne({ email });
    if (existingEmail) {
      console.log("Email already registered:", email);
      return res.render("login", {
        title: "Nature Nexus - Register",
        error: "Email already registered",
        currentPage: "register",
      });
    }

    // Check if username already exists (if provided)
    if (username) {
      const existingUsername = await User.findOne({ username });
      if (existingUsername) {
        console.log("Username already taken:", username);
        return res.render("login", {
          title: "Nature Nexus - Register",
          error: "Username already taken",
          currentPage: "register",
        });
      }
    }

    const saltRounds = process.env.SALT_ROUND
      ? parseInt(process.env.SALT_ROUND)
      : 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    console.log("Password hashed successfully");

    const newUser = new User({
      email,
      username: username || email.split("@")[0], // Use part of email as username if not provided
      password: hashedPassword,
      stats: { birds: 0, plants: 0 },
      collections: [],
      createdAt: new Date(),
    });

    const savedUser = await newUser.save();
    console.log("User saved to MongoDB:", savedUser._id);

    // Optionally auto-login after registration
    // req.session.user = savedUser;
    // return res.redirect("/");

    // Or redirect to login page with success message
    res.render("login", {
      title: "Nature Nexus - Login",
      error: "Registration successful! Please log in with your credentials.",
      currentPage: "login",
    });
  } catch (err) {
    console.error("Registration error:", err);
    res.render("login", {
      title: "Nature Nexus - Register",
      error: `Registration failed: ${err.message}`,
      currentPage: "register",
    });
  }
});

// Logout route - clear remember me token
router.get("/logout", async (req, res) => {
  try {
    // If user is logged in, clear their remember token
    if (req.session.user) {
      await User.findByIdAndUpdate(req.session.user._id, {
        rememberToken: null,
        rememberTokenExpiresAt: null,
      });

      // Clear the remember token cookie
      res.clearCookie("remember_token");
    }

    // Destroy the session
    req.session.destroy(() => {
      res.redirect("/login");
    });
  } catch (err) {
    console.error("Logout error:", err);
    res.redirect("/login");
  }
});

// Forgot password page
router.get("/forgot-password", (req, res) => {
  res.render("forgot-password", {
    title: "Nature Nexus - Forgot Password",
    error: null,
    success: null,
  });
});

// Forgot password submission
router.post("/forgot-password", async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.render("forgot-password", {
        title: "Nature Nexus - Forgot Password",
        error: "No account found with that email address",
        success: null,
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString("hex");

    // Set token expiry (1 hour from now)
    const resetExpiry = new Date();
    resetExpiry.setHours(resetExpiry.getHours() + 1);

    // Save to user model
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = resetExpiry;
    await user.save();

    // In a real app, you would send an email with the reset link
    // For now, just log it
    console.log(
      `Password reset link: http://localhost:3000/reset-password/${resetToken}`
    );

    res.render("forgot-password", {
      title: "Nature Nexus - Forgot Password",
      error: null,
      success: "Password reset instructions have been sent to your email",
    });
  } catch (err) {
    console.error("Forgot password error:", err);
    res.render("forgot-password", {
      title: "Nature Nexus - Forgot Password",
      error: "An error occurred",
      success: null,
    });
  }
});

// Reset password page - validates the token
router.get("/reset-password/:token", async (req, res) => {
  try {
    const { token } = req.params;

    // Find user with this token and valid expiry
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: new Date() },
    });

    if (!user) {
      return res.render("reset-password", {
        title: "Nature Nexus - Reset Password",
        tokenValid: false,
        token: token,
        error: null,
      });
    }

    res.render("reset-password", {
      title: "Nature Nexus - Reset Password",
      tokenValid: true,
      token: token,
      error: null,
    });
  } catch (err) {
    console.error("Reset password page error:", err);
    res.render("reset-password", {
      title: "Nature Nexus - Reset Password",
      tokenValid: false,
      token: req.params.token,
      error: "An error occurred",
    });
  }
});

// Reset password submission
router.post("/reset-password/:token", async (req, res) => {
  try {
    const { token } = req.params;
    const { password, confirmPassword } = req.body;

    // Validate password match
    if (password !== confirmPassword) {
      return res.render("reset-password", {
        title: "Nature Nexus - Reset Password",
        tokenValid: true,
        token: token,
        error: "Passwords do not match",
      });
    }

    // Find user with this token and valid expiry
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: new Date() },
    });

    if (!user) {
      return res.render("reset-password", {
        title: "Nature Nexus - Reset Password",
        tokenValid: false,
        token: token,
        error: null,
      });
    }

    // Hash the new password
    const saltRounds = process.env.SALT_ROUND
      ? parseInt(process.env.SALT_ROUND)
      : 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Update user password and clear reset token
    user.password = hashedPassword;
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    await user.save();

    // Redirect to login with success message
    req.session.passwordResetSuccess = true;
    res.redirect("/login");
  } catch (err) {
    console.error("Reset password error:", err);
    res.render("reset-password", {
      title: "Nature Nexus - Reset Password",
      tokenValid: true,
      token: req.params.token,
      error: "An error occurred while resetting your password",
    });
  }
});

// Check remember token middleware
// Add this middleware to your app.js to check for remember_token on every request
const checkRememberToken = async (req, res, next) => {
  if (!req.session.user && req.cookies.remember_token) {
    try {
      // Find user with this token and valid expiry
      const user = await User.findOne({
        rememberToken: req.cookies.remember_token,
        rememberTokenExpiresAt: { $gt: new Date() },
      });

      if (user) {
        // Auto-login the user
        req.session.user = user;

        // Update last login timestamp
        user.lastLoginAt = new Date();
        await user.save();

        console.log("User auto-logged in via remember token:", user.email);
      }
    } catch (err) {
      console.error("Remember token check error:", err);
    }
  }
  next();
};

// Export both the router and middleware
module.exports = {
  router,
  checkRememberToken,
};
