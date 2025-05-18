const express = require("express");
const session = require("express-session");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
require("dotenv").config();
const path = require("path");

const app = express();
const port = 3000;

// MongoDB Connection using .env
mongoose
  .connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log("Connected to MongoDB");
  })
  .catch((err) => console.error("MongoDB connection error:", err));

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(
  session({
    secret: "your-secret-key",
    resave: false,
    saveUninitialized: false,
  })
);
app.use(express.static("public"));
app.set("views", "./views");
app.set("view engine", "ejs");

// Import routes
const authRoutes = require("./routes/auth");
const identifyRoutes = require("./routes/identify");
const articlesRoutes = require("./routes/articles");
const collectionsRoutes = require("./routes/collections");
const settingsRoutes = require("./routes/settings");
const exploreRoutes = require("./routes/explore");
const sightingsRoutes = require("./routes/sightings");

// Use routes
app.use(authRoutes);
app.use(identifyRoutes);
app.use(articlesRoutes);
app.use(collectionsRoutes);
app.use(settingsRoutes);
app.use(exploreRoutes);
app.use(sightingsRoutes);

app.get("/", (req, res) => {
  res.render("index", {
    title: "Nature Nexus - Home",
    user: req.session.user || null,
    currentPage: "home",
  });
});

app.get("/index", (req, res) => {
  res.render("index", {
    title: "Nature Nexus - Home",
    user: req.session.user || null,
    currentPage: "home",
  });
});

// Start Server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
