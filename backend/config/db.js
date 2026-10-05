const mongoose = require("mongoose");

let connectionPromise;

const connectDB = async () => {
  if (mongoose.connection.readyState === 1) {
    return;
  }

  if (connectionPromise) {
    return connectionPromise;
  }

  connectionPromise = mongoose.connect(process.env.MONGO_URI);

  try {
    await connectionPromise;
    console.log("MongoDB connected");
    connectionPromise = null;
  } catch (error) {
    console.error("MongoDB connection failed:", error.message);
    connectionPromise = null;
    throw error;
  }
};

module.exports = connectDB;