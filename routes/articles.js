// routes/articles.js
const express = require("express");
const router = express.Router();

// Getting started article
router.get("/articles/getting-started", (req, res) => {
  res.render("articles/getting-started", {
    title: "Getting Started with Bird Watching - Nature Nexus",
    user: req.session.user || null,
    currentPage: "articles",
  });
});

// Bird identification tips article
router.get("/articles/bird-identification-tips", (req, res) => {
  res.render("articles/bird-identification-tips", {
    title: "Bird Identification Tips - Nature Nexus",
    user: req.session.user || null,
    currentPage: "articles",
  });
});

// Bird photography fundamentals article
router.get("/articles/bird-photography-fundamentals", (req, res) => {
  res.render("articles/bird-photography-fundamentals", {
    title: "Bird Photography Fundamentals - Nature Nexus",
    user: req.session.user || null,
    currentPage: "articles",
  });
});

// Migration guide article
router.get("/articles/migration-guide", (req, res) => {
  res.render("articles/migration-guide", {
    title: "Seasonal Bird Migration Guide",
    user: req.session.user || null,
    currentPage: "articles",
  });
});

// Journal guide article
router.get("/articles/journal-guide", (req, res) => {
  res.render("articles/journal-guide", {
    title: "Creating Your Bird Watching Journal",
    user: req.session.user || null,
    currentPage: "articles",
  });
});

module.exports = router;
