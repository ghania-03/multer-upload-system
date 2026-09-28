const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true
    },

    email: {
      type: String,
      required: true,
      unique: true
    },

    profileImage: {
      type: String,
      default: null
    },

    documents: [
      {
        url: {
          type: String,
          required: true
        },

        originalName: {
          type: String,
          required: true
        },

        uploadedAt: {
          type: Date,
          default: Date.now
        }
      }
    ]
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("User", userSchema);