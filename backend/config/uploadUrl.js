const path = require("path");

const buildPublicUrl = (req, file) => {
  const uploadsDirectory = path.join(__dirname, "..", "uploads");

  const relativePath = path
    .relative(uploadsDirectory, file.path)
    .replace(/\\/g, "/");

  return `${req.protocol}://${req.get("host")}/uploads/${relativePath}`;
};

module.exports = buildPublicUrl;