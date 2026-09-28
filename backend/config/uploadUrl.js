const buildPublicUrl = (req, file) => {
  const relativePath = file.path
    .replace(/\\/g, "/")
    .replace(/^uploads\//, "");

  return `${req.protocol}://${req.get("host")}/uploads/${relativePath}`;
};

module.exports = buildPublicUrl;
