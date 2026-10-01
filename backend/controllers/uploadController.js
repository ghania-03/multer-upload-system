const User = require("../models/User");

const {
  uploadBuffer,
  deleteCloudinaryFile
} = require("../config/cloudinaryUpload");

const sanitizeName = (name) => {
  return name
    .replace(/\s+/g, "")
    .replace(/[^a-zA-Z0-9_-]/g, "");
};

const getUserFolder = (user) => {
  return `multer-upload-system/${user._id}_${sanitizeName(
    user.fullName
  )}`;
};

const getFileName = (originalName) => {
  const nameWithoutExtension = originalName
    .replace(/\.[^/.]+$/, "")
    .replace(/[^a-zA-Z0-9_-]/g, "-");

  return `${Date.now()}-${nameWithoutExtension}`;
};

const uploadProfileImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No profile image was uploaded."
      });
    }

    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found."
      });
    }

    const oldProfileImagePublicId = user.profileImagePublicId;
    const oldProfileImageResourceType =
      user.profileImageResourceType;

    const folder = `${getUserFolder(user)}/profile`;

    const result = await uploadBuffer(req.file.buffer, {
      folder,
      public_id: getFileName(req.file.originalname),
      resource_type: "auto"
    });

    user.profileImage = result.secure_url;
    user.profileImagePublicId = result.public_id;
    user.profileImageResourceType = result.resource_type;

    try {
      await user.save();
    } catch (error) {
      // If MongoDB update fails, remove the newly uploaded
      // Cloudinary file so it does not become orphaned.
      await deleteCloudinaryFile(
        result.public_id,
        result.resource_type
      ).catch((deleteError) => {
        console.error(
          "Failed to clean up new Cloudinary profile image:",
          deleteError
        );
      });

      throw error;
    }

    // Delete the previous profile image only after
    // the new image and MongoDB update succeed.
    if (oldProfileImagePublicId) {
      try {
        await deleteCloudinaryFile(
          oldProfileImagePublicId,
          oldProfileImageResourceType || "image"
        );

        console.log("Old profile image deleted from Cloudinary.");
      } catch (error) {
        console.error(
          "Failed to delete old profile image from Cloudinary:",
          error
        );
      }
    }

    return res.status(201).json({
      success: true,
      message: "Profile image uploaded successfully.",
      profileImage: user.profileImage
    });
  } catch (error) {
    console.error("Profile upload error:", error);

    return res.status(500).json({
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

    const folder = `${getUserFolder(user)}/documents`;
    const uploadedFiles = [];

    try {
      for (const file of req.files) {
        // Check whether a document with the same original name already exists
        const existingDocument = user.documents.find(
          (document) => document.originalName === file.originalname
        );

        const result = await uploadBuffer(file.buffer, {
          folder,
          public_id: getFileName(file.originalname),
          resource_type: "auto"
        });

        const newDocument = {
          url: result.secure_url,
          publicId: result.public_id,
          resourceType: result.resource_type,
          originalName: file.originalname
        };

        uploadedFiles.push({
          newDocument,
          existingDocument
        });
      }
    } catch (error) {
      // Clean up anything uploaded to Cloudinary if the process fails
      for (const file of uploadedFiles) {
        await deleteCloudinaryFile(
          file.newDocument.publicId,
          file.newDocument.resourceType
        ).catch((deleteError) => {
          console.error(
            "Failed to clean up Cloudinary document:",
            deleteError
          );
        });
      }

      throw error;
    }

    // Replace existing documents with the same name
    for (const file of uploadedFiles) {
      if (file.existingDocument) {
        if (file.existingDocument.publicId) {
          await deleteCloudinaryFile(
            file.existingDocument.publicId,
            file.existingDocument.resourceType || "image"
          );
        }

        file.existingDocument.url = file.newDocument.url;
        file.existingDocument.publicId = file.newDocument.publicId;
        file.existingDocument.resourceType =
          file.newDocument.resourceType;
        file.existingDocument.originalName =
          file.newDocument.originalName;
        file.existingDocument.uploadedAt = new Date();
      } else {
        user.documents.push(file.newDocument);
      }
    }

    await user.save();

    return res.status(201).json({
      success: true,
      message: "Documents uploaded successfully.",
      documents: user.documents
    });
  } catch (error) {
    console.error("Document upload error:", error);

    return res.status(500).json({
      success: false,
      message: "Something went wrong while uploading documents."
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

    if (document.publicId) {
      try {
        await deleteCloudinaryFile(
          document.publicId,
          document.resourceType || "image"
        );
      } catch (error) {
        console.error(
          "Failed to delete document from Cloudinary:",
          error
        );

        return res.status(500).json({
          success: false,
          message: "Could not delete document from Cloudinary."
        });
      }
    }

    document.deleteOne();

    await user.save();

    return res.status(200).json({
      success: true,
      message: "Document deleted successfully."
    });
  } catch (error) {
    console.error("Delete document error:", error);

    return res.status(500).json({
      success: false,
      message: "Something went wrong while deleting document."
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
        message: "New document name is required."
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

    // Keep the original file extension
    const currentExtension = document.originalName.includes(".")
      ? document.originalName.substring(
          document.originalName.lastIndexOf(".")
        )
      : "";

    let finalName = trimmedName;

    // If the user does not provide an extension,
    // keep the existing extension.
    if (
      currentExtension &&
      !finalName
        .toLowerCase()
        .endsWith(currentExtension.toLowerCase())
    ) {
      finalName += currentExtension;
    }

    // Check ALL documents, including the current document.
    // This means renaming pdf-1.pdf to pdf-1 will also
    // show the duplicate-name message.
    const duplicateDocument = user.documents.find(
      (item) =>
        item.originalName.toLowerCase() ===
        finalName.toLowerCase()
    );

    if (duplicateDocument) {
      return res.status(400).json({
        success: false,
        message: "A document with this name already exists."
      });
    }

    if (!document.publicId) {
      return res.status(400).json({
        success: false,
        message:
          "This document cannot be renamed because its Cloudinary ID is missing."
      });
    }

    // Remove extension for Cloudinary public_id
    const newPublicIdName = finalName
      .replace(/\.[^/.]+$/, "")
      .replace(/[^a-zA-Z0-9_-]/g, "-");

    const folder = `${getUserFolder(user)}/documents`;
    const newPublicId = `${folder}/${newPublicIdName}`;

    const cloudinary = require("../config/cloudinary");

    // Rename the actual Cloudinary file
    const result = await cloudinary.uploader.rename(
      document.publicId,
      newPublicId,
      {
        resource_type: document.resourceType || "image",
        type: "upload",
        invalidate: true
      }
    );

    // Update MongoDB using the values returned by Cloudinary
    document.originalName = finalName;
    document.publicId = result.public_id;
    document.url = result.secure_url;

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
      message: "Something went wrong while renaming the document."
    });
  }
};

module.exports = {
  uploadProfileImage,
  uploadDocuments,
  deleteDocument,
  renameDocument
};