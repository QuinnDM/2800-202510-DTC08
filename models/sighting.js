const mongoose = require('mongoose');

const sightingSchema = new mongoose.Schema({
  userId: {
    type: String,
    ref: 'User', // assumes you have a User model
    required: true
  }, 
  username: {
    type: String,
    required: false
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
  },
  userDescription: {
    type: String,
    required: false
  }
});

// Enable geospatial indexing
sightingSchema.index({ location: '2dsphere' });

const Sighting = mongoose.model('Sighting', sightingSchema);

module.exports = Sighting;
