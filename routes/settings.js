
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

  module.exports = router;