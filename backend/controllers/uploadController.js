const User = require("../models/User");
const buildPublicUrl = require("../config/uploadUrl");

const uploadProfileImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No profile image was uploaded."
      });
    }

    const publicUrl = buildPublicUrl(req, req.file);

    const user = await User.findByIdAndUpdate(
      req.user._id,
      {
        profileImage: publicUrl
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