const User = require("../models/User");

const createTestUser = async () => {
  const testUserId = "68d92a7e5c3b2a1f4e6d8c90";

  let user = await User.findById(testUserId);

  if (!user) {
    user = await User.create({
      _id: testUserId,
      fullName: "John Doe",
      email: "john@example.com"
    });

    console.log("Test user created");
  }

  return user;
};

module.exports = createTestUser;