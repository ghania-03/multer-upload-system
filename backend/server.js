const express = require("express");
const dotenv = require("dotenv");
const multer = require("multer");
const cors = require("cors");
const path = require("path");

const connectDB = require("./config/db");
const createTestUser = require("./config/testUser");
const uploadRoutes = require("./routes/uploadRoutes");

dotenv.config();

const app = express();

app.use(
  cors({
    origin: "http://localhost:5173"
  })
);

app.use(express.json());

// Temporary test user
app.use((req, res, next) => {
  req.user = {
    _id: "68d92a7e5c3b2a1f4e6d8c90",
    fullName: "John Doe"
  };

  next();
});

// Serve uploaded files
app.use(
  "/uploads",
  express.static(path.join(__dirname, "uploads"))
);

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

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  await connectDB();
  await createTestUser();

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
};

startServer();