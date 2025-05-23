const express = require("express");
const router = express.Router();

// Settings page route
router.get("/settings", (req, res) => {
  res.render("settings", {
    title: "Nature Nexus - Settings",
    user: req.session.user || null,
    currentPage: "settings",
  });
});

router.get("/about", (req, res) => {
  res.render("about", {
    title: "About - Nature Nexus",
    user: req.session.user || null,
    currentPage: "about",
  });
});

router.get("/terms", (req, res) => {
  res.render("terms", {
    title: "Terms of Service - Nature Nexus",
    user: req.session.user || null,
    currentPage: "terms",
  });
});
router.get("/privacy", (req, res) => {
  res.render("privacy", {
    title: "Privacy Policy - Nature Nexus",
    user: req.session.user || null,
    currentPage: "privacy",
  });
});

module.exports = router;
