// models/dailyFeature.js

const mongoose = require("mongoose");

const dailyFeatureSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ["bird", "plant"],
    required: true,
  },
  commonName: {
    type: String,
    required: true,
    trim: true,
  },
  scientificName: {
    type: String,
    required: true,
    trim: true,
  },
  family: {
    type: String,
    required: true,
    trim: true,
  },
  // Bird-specific fields
  habitat: {
    type: String,
    trim: true,
  },
  conservationStatus: {
    type: String,
    trim: true,
  },
  // Plant-specific fields
  nativeRegion: {
    type: String,
    trim: true,
  },
  uses: {
    type: String,
    trim: true,
  },
  // Common fields
  description: {
    type: String,
    required: true,
  },
  interestingFacts: {
    type: [String],
    default: [],
  },
  imageUrl: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  featured: {
    type: Boolean,
    default: true,
  },
});

const DailyFeature = mongoose.model("DailyFeature", dailyFeatureSchema);

module.exports = DailyFeature;
