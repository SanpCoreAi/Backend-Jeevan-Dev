const crypto = require("crypto");
const bcrypt = require("bcryptjs");

const User = require("../../models/usermodel");

exports.resetPassword = async (token, password) => {
  try {

    if (!token || !password) {
      return {
        statusCode: 400,
        body: {
          message: "Token and password are required"
        }
      };
    }

    // Hash incoming token
    const tokenHash = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    // Find user using hashed token
    const user = await User.findUserByResetToken(tokenHash);

    if (!user) {
      return {
        statusCode: 400,
        body: {
          message: "Invalid or expired reset token"
        }
      };
    }

    // Check expiry
    if (new Date(user.reset_token_expiry) < new Date()) {
      return {
        statusCode: 400,
        body: {
          message: "Reset token has expired"
        }
      };
    }

    // Load complete user
    const userData = await User.findById(user.id);

    if (!userData) {
      return {
        statusCode: 404,
        body: {
          message: "User not found"
        }
      };
    }

    // Prevent same password
    const isSamePassword = await bcrypt.compare(
      password,
      userData.password
    );

    if (isSamePassword) {
      return {
        statusCode: 400,
        body: {
          message:
            "New password cannot be same as current password"
        }
      };
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Update password
    const updated = await User.updatePassword(
      user.id,
      hashedPassword
    );

    if (!updated) {
      return {
        statusCode: 500,
        body: {
          message: "Failed to update password"
        }
      };
    }

    // Clear reset token
    await User.clearResetToken(user.id);

    return {
      statusCode: 200,
      body: {
        message: "Password reset successfully"
      }
    };

  } catch (error) {

    console.error("Reset Password Error:", error);

    return {
      statusCode: 500,
      body: {
        message: "Internal Server Error"
      }
    };

  }
};