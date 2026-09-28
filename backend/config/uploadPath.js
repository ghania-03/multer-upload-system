const extractRelativePath = (url) => {
  const urlObject = new URL(url);

  return urlObject.pathname.replace(/^\/uploads\//, "");
};

module.exports = extractRelativePath;