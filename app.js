// app.js
const express = require("express");
const session = require("express-session");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
require("dotenv").config();
const path = require("path");

// Import routes
const indexRoutes = require("./routes/index");
const authRoutes = require("./routes/auth");
const collectionsRoutes = require("./routes/collections");
const sightingsRoutes = require("./routes/sightings");
const articlesRoutes = require("./routes/articles");
const identifyRoutes = require("./routes/identify");
const apiRoutes = require("./routes/api");
const uploadRoutes = require("./routes/upload");

const app = express();

// MongoDB Connection using .env
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
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

// Use route modules
app.use(indexRoutes);
app.use(authRoutes);
app.use(collectionsRoutes);
app.use(sightingsRoutes);
app.use(articlesRoutes);
app.use(identifyRoutes);
app.use(apiRoutes);
app.use(uploadRoutes);

module.exports = app;
