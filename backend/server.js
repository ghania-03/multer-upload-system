const dotenv = require("dotenv");
dotenv.config();

const express = require("express");
const multer = require("multer");
const cors = require("cors");

const connectDB = require("./config/db");
const createTestUser = require("./config/testUser");
const uploadRoutes = require("./routes/uploadRoutes");

const app = express();
let testUserPromise;

const ensureTestUser = () => {
  if (!testUserPromise) {
    testUserPromise = createTestUser().catch((error) => {
      testUserPromise = null;
      throw error;
    });
  }

  return testUserPromise;
};

app.use(
  cors({
    origin: [
      "http://localhost:5173",
      process.env.FRONTEND_URL
    ]
  })
);

app.use(express.json());

app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Upload API is running."
  });
});

app.use(async (req, res, next) => {
  try {
    await connectDB();
    await ensureTestUser();
    next();
  } catch (error) {
    console.error("MongoDB connection failed:", error.message);
    res.status(503).json({
      success: false,
      message: "Database unavailable."
    });
  }
});

// Temporary test user
app.use((req, res, next) => {
  req.user = {
    _id: "68d92a7e5c3b2a1f4e6d8c90",
    fullName: "John Doe"
  };

  next();
});

// Upload routes
app.use("/api/uploads", uploadRoutes);

// Error handler
app.use((err, req, res, next) => {
  console.error("================================");
  console.error("ERROR:", err);
  console.error("================================");

  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        success: false,
        message: "File is too large."
      });
    }

    return res.status(400).json({
      success: false,
      message: err.message
    });
  }

  if (err) {
    return res.status(400).json({
      success: false,
      message: err.message || "Upload failed."
    });
  }

  next(err);
});

// Local development
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  await connectDB();
  await ensureTestUser();

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
};

if (process.env.VERCEL !== "1") {
  startServer();
}

// Export Express app for Vercel
module.exports = app;