const express = require("express");

const {
  uploadProfile,
  uploadDocument
} = require("../middleware/uploadMiddleware");

const {
  uploadProfileImage,
  uploadDocuments,
  deleteDocument,
  renameDocument
} = require("../controllers/uploadController");

const User = require("../models/User");

const router = express.Router();

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

router.delete(
  "/documents/:documentId",
  deleteDocument
);

router.patch(
  "/documents/:documentId/rename",
  renameDocument
);

router.get("/me", async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found."
      });
    }

    return res.status(200).json({
      success: true,
      user
    });
  } catch (error) {
    console.error("Get user error:", error);

    return res.status(500).json({
      success: false,
      message: "Something went wrong."
    });
  }
});

router.delete("/documents/:documentId", deleteDocument);

module.exports = router;