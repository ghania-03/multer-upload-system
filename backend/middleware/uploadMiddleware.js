const multer = require("multer");
const fs = require("fs");
const path = require("path");

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const userFolderName = `${req.user._id}_${req.user.fullName.replace(
      /\s+/g,
      ""
    )}`;

    const subFolder =
      file.fieldname === "profile" ? "profile" : "documents";

    const uploadPath = path.join(
      "uploads",
      userFolderName,
      subFolder
    );

    fs.mkdirSync(uploadPath, { recursive: true });

    cb(null, uploadPath);
  },

  filename: function (req, file, cb) {
    const uniqueName =
      Date.now() +
      "-" +
      path.basename(file.originalname);

    cb(null, uniqueName);
  }
});

// Profile: images only
const profileFilter = (req, file, cb) => {
  if (!file.mimetype.startsWith("image/")) {
    return cb(
      new Error("Only image files are allowed for profile picture.")
    );
  }

  cb(null, true);
};

// Documents: PDF + images
const documentFilter = (req, file, cb) => {
  const allowedTypes = [
    "application/pdf",
    "image/jpeg",
    "image/png"
  ];

  if (!allowedTypes.includes(file.mimetype)) {
    return cb(new Error("Only PDF, JPG, JPEG and PNG files are allowed."));
  }

  cb(null, true);
};

const uploadProfile = multer({
  storage,
  fileFilter: profileFilter,

  limits: {
    fileSize: 2 * 1024 * 1024
  }
});

const uploadDocument = multer({
  storage,
  fileFilter: documentFilter,

  limits: {
    fileSize: 10 * 1024 * 1024
  }
});

module.exports = {
  uploadProfile,
  uploadDocument
};