const fs = require("fs");
const path = require("path");

const User = require("../models/User");
const buildPublicUrl = require("../config/uploadUrl");
const extractRelativePath = require("../config/uploadPath");

const uploadProfileImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No profile image was uploaded."
      });
    }

    // 1. Get the existing user
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found."
      });
    }

    // 2. Keep the old profile image URL
    const oldProfileImage = user.profileImage;

    // 3. Build the new public URL
    const newProfileImage = buildPublicUrl(req, req.file);

    // 4. Update MongoDB first
    user.profileImage = newProfileImage;

    await user.save();

    // 5. Delete old physical file only after DB update succeeds
    if (oldProfileImage) {
      const relativePath = extractRelativePath(oldProfileImage);

      const oldFilePath = path.join(
        __dirname,
        "..",
        "uploads",
        relativePath
      );

      if (fs.existsSync(oldFilePath)) {
        fs.unlink(oldFilePath, (error) => {
          if (error) {
            console.error("Failed to delete old profile image:", error);
          } else {
            console.log("Old profile image deleted.");
          }
        });
      }
    }

    res.status(201).json({
      success: true,
      message: "Profile image uploaded successfully.",
      profileImage: user.profileImage
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Something went wrong while uploading profile image."
    });
  }
};

const uploadDocuments = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No documents were uploaded."
      });
    }

    const documents = req.files.map((file) => ({
      url: buildPublicUrl(req, file),
      originalName: file.originalname
    }));

    const user = await User.findByIdAndUpdate(
      req.user._id,
      {
        $push: {
          documents: {
            $each: documents
          }
        }
      },
      {
        new: true
      }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found."
      });
    }

    res.status(201).json({
      success: true,
      message: "Documents uploaded successfully.",
      documents: user.documents
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Something went wrong while uploading documents."
    });
  }
};

module.exports = {
  uploadProfileImage,
  uploadDocuments
};