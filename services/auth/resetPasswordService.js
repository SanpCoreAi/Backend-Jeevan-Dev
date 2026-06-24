const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const User = require("../../models/usermodel");

exports.resetPassword = async (
  token,
  password
) => {
  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    const hashedPassword =
      await bcrypt.hash(password, 12);

    await User.updatePassword(
      decoded.userId,
      hashedPassword
    );

    return {
      statusCode: 200,
      body: {
        message:
          "Password reset successfully",
      },
    };
  } catch (error) {
    return {
      statusCode: 400,
      body: {
        message:
          "Invalid or expired token",
      },
    };
  }
};