const multer = require("multer");

const storage = multer.memoryStorage();

const profileFilter = (req, file, cb) => {
  if (!file.mimetype.startsWith("image/")) {
    return cb(
      new Error("Only image files are allowed for profile picture.")
    );
  }

  cb(null, true);
};

const documentFilter = (req, file, cb) => {
  const allowedTypes = [
    "application/pdf",
    "image/jpeg",
    "image/png"
  ];

  if (!allowedTypes.includes(file.mimetype)) {
    return cb(
      new Error("Only PDF, JPG, JPEG and PNG files are allowed.")
    );
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