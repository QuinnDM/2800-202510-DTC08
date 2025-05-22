const mongoose = require('mongoose');

// Define the user schema
const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true
  },
  stats: {
    birds: {
      type: Number,
      default: 0
    },
    plants: {
      type: Number,
      default: 0
    },
    points: {
      type: Number,
      default: 0
    }
  },
  collections: [
    {
      name: {
        type: String,
        required: true
      },
      items: [
        {
          type: {
            type: String,
            enum: ['bird', 'plant'],
            required: true
          },
          commonName: {
            type: String,
            required: true
          },
          scientificName: {
            type: String,
            required: true
          },
          imageUrl: {
            type: String,
            required: true
          },
          identifiedOn: {
            type: Date,
            default: Date.now
          },
          details: {
            type: mongoose.Schema.Types.Mixed
          }
        }
      ]
    }
  ],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Create and export the User model
const User = mongoose.model('User', userSchema);

module.exports = User;