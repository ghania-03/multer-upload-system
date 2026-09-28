const express = require("express");
const User = require("../models/User");

const {
  uploadProfile,
  uploadDocument
} = require("../middleware/uploadMiddleware");

const {
  uploadProfileImage,
  uploadDocuments
} = require("../controllers/uploadController");

const router = express.Router();

router.get("/me", async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found."
      });
    }

    res.json({
      success: true,
      user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Something went wrong."
    });
  }
});

router.post(
  "/profile",
  uploadProfile.single("profile"),
  uploadProfileImage
);

router.post(
  "/documents",
  uploadDocument.array("documents", 5),
  uploadDocuments
);

module.exports = router;