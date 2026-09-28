const express = require("express");
const dotenv = require("dotenv");
const multer = require("multer");
const uploadRoutes = require("./routes/uploadRoutes");
const path = require("path");
const connectDB = require("./config/db");
const createTestUser = require("./config/testUser");

dotenv.config();


const app = express();

app.use(express.json());

const testUserId = "68d92a7e5c3b2a1f4e6d8c90";
// Temporary test user
app.use((req, res, next) => {
  req.user = {
    _id: testUserId,
    fullName: "John Doe"
  };

  next();
});

app.use(
  "/uploads",
  express.static(path.join(__dirname, "uploads"))
);

app.use("/api/uploads", uploadRoutes);

// Multer and upload error handling
app.use((err, req, res, next) => {
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
      message: err.message
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