const mongoose = require('mongoose');

const sightingSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // assumes you have a User model
    required: true
  },
  species: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      required: true
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: true
    }
  },
  photoUrl: {
    type: String,
    required: false
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  taxonomicGroup: {
    type: String,
    required: true
  }
});

// Enable geospatial indexing
sightingSchema.index({ location: '2dsphere' });

const Sighting = mongoose.model('Sighting', sightingSchema);

module.exports = Sighting;
