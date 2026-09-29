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

    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found."
      });
    }

    const replace = req.query.replace === "true";

    const newDocuments = [];

    for (const file of req.files) {
      const existingDocument = user.documents.find(
        (document) => document.originalName === file.originalname
      );

      // Duplicate found but replacement was not confirmed
      if (existingDocument && !replace) {
        // Delete the newly uploaded duplicate file
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }

        return res.status(409).json({
          success: false,
          duplicate: true,
          duplicateName: file.originalname,
          message: `"${file.originalname}" already exists.`
        });
      }

      // Replace existing document
      if (existingDocument && replace) {
        const oldRelativePath = extractRelativePath(
          existingDocument.url
        );

        const oldFilePath = path.join(
          __dirname,
          "..",
          "uploads",
          oldRelativePath
        );

        // Delete old physical file
        if (fs.existsSync(oldFilePath)) {
          fs.unlinkSync(oldFilePath);
        }

        // Remove old MongoDB document
        existingDocument.deleteOne();
      }

      newDocuments.push({
        url: buildPublicUrl(req, file),
        originalName: file.originalname
      });
    }

    user.documents.push(...newDocuments);

    await user.save();

    return res.status(201).json({
      success: true,
      message: "Documents uploaded successfully.",
      documents: user.documents
    });
  } catch (error) {
    console.error("Upload documents error:", error);

    res.status(500).json({
      success: false,
      message: "Something went wrong while uploading documents."
    });
  }
};

const renameDocument = async (req, res) => {
  try {
    const { documentId } = req.params;
    const { newName } = req.body;

    if (!newName || !newName.trim()) {
      return res.status(400).json({
        success: false,
        message: "New file name is required."
      });
    }

    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found."
      });
    }

    const document = user.documents.id(documentId);

    if (!document) {
      return res.status(404).json({
        success: false,
        message: "Document not found."
      });
    }

    const trimmedName = newName.trim();

    // Check if another document already has this name
    const duplicateName = user.documents.find(
      (item) =>
        item._id.toString() !== documentId &&
        item.originalName === trimmedName
    );

    if (duplicateName) {
      return res.status(409).json({
        success: false,
        message: `"${trimmedName}" already exists.`
      });
    }

    const oldRelativePath = extractRelativePath(
      document.url
    );

    const oldFilePath = path.join(
      __dirname,
      "..",
      "uploads",
      oldRelativePath
    );

    const directory = path.dirname(oldFilePath);

    const extension = path.extname(document.originalName);

    let finalName = trimmedName;

    // Keep the original extension if the user doesn't provide one
    if (!path.extname(finalName)) {
      finalName += extension;
    }

    const newFilePath = path.join(
      directory,
      finalName
    );

    if (fs.existsSync(newFilePath)) {
      return res.status(409).json({
        success: false,
        message: `"${finalName}" already exists.`
      });
    }

    fs.renameSync(oldFilePath, newFilePath);

    document.originalName = finalName;

    const newRelativePath = path
      .relative(
        path.join(__dirname, "..", "uploads"),
        newFilePath
      )
      .replace(/\\/g, "/");

    document.url = `${req.protocol}://${req.get(
      "host"
    )}/uploads/${newRelativePath}`;

    await user.save();

    return res.status(200).json({
      success: true,
      message: "Document renamed successfully.",
      document
    });
  } catch (error) {
    console.error("Rename document error:", error);

    return res.status(500).json({
      success: false,
      message: "Something went wrong while renaming document."
    });
  }
};

const deleteDocument = async (req, res) => {
  try {
    const { documentId } = req.params;

    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found."
      });
    }

    const document = user.documents.id(documentId);

    if (!document) {
      return res.status(404).json({
        success: false,
        message: "Document not found."
      });
    }

    const relativePath = extractRelativePath(document.url);

    const filePath = path.join(
      __dirname,
      "..",
      "uploads",
      relativePath
    );

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    document.deleteOne();

    await user.save();

    res.status(200).json({
      success: true,
      message: "Document deleted successfully."
    });
  } catch (error) {
    console.error("Delete document error:", error);

    res.status(500).json({
      success: false,
      message: "Something went wrong while deleting document."
    });
  }
};

module.exports = {
  uploadProfileImage,
  uploadDocuments,
  deleteDocument,
  renameDocument
};