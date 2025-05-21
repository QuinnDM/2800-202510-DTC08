const mongoose = require("mongoose");

// Define the user schema
const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
  },
  username: {
    type: String,
    required: false,
    unique: true,
    trim: true,
  },
  password: {
    type: String,
    required: true,
  },
  // Social login IDs
  googleId: {
    type: String,
    sparse: true,
  },
  appleId: {
    type: String,
    sparse: true,
  },
  profilePicture: {
    type: String,
    trim: true,
  },
  // Added personal information fields
  firstName: {
    type: String,
    trim: true,
  },
  lastName: {
    type: String,
    trim: true,
  },
  address: {
    type: String,
    trim: true,
  },
  city: {
    type: String,
    trim: true,
  },
  state: {
    type: String,
    trim: true,
  },
  zipCode: {
    type: String,
    trim: true,
  },
  country: {
    type: String,
    trim: true,
  },
  phone: {
    type: String,
    trim: true,
  },
  stats: {
    birds: {
      type: Number,
      default: 0,
    },
    plants: {
      type: Number,
      default: 0,
    },
  },
  collections: [
    {
      name: {
        type: String,
        required: true,
      },
      items: [
        {
          type: {
            type: String,
            enum: ["bird", "plant"],
            required: true,
          },
          commonName: {
            type: String,
            required: true,
          },
          scientificName: {
            type: String,
            required: true,
          },
          imageUrl: {
            type: String,
            required: true,
          },
          identifiedOn: {
            type: Date,
            default: Date.now,
          },
          details: {
            type: mongoose.Schema.Types.Mixed,
          },
        },
      ],
    },
  ],
  // Remember me token for login persistence
  rememberToken: {
    type: String,
  },
  // Token expiry date
  rememberTokenExpiresAt: {
    type: Date,
  },
  // Password reset fields
  resetPasswordToken: {
    type: String,
  },
  resetPasswordExpires: {
    type: Date,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  lastLoginAt: {
    type: Date,
  },
});

// Create and export the User model
const User = mongoose.model("User", userSchema);

module.exports = User;