const bcrypt = require("bcryptjs");
const User = require("../../models/usermodel");

exports.changePassword = async (userId, data) => {
  try {

    const oldPassword = data.oldPassword.trim();
    const newPassword = data.newPassword.trim();

    const user = await User.findById(userId);

    if (!user) {
      return {
        statusCode: 404,
        body: {
          message: "User not found",
        },
      };
    }

    if (
      user.status &&
      user.status !== "ACTIVE"
    ) {
      return {
        statusCode: 403,
        body: {
          message: "Your account is inactive",
        },
      };
    }

    const isOldPasswordCorrect =
      await bcrypt.compare(
        oldPassword,
        user.password
      );

    if (!isOldPasswordCorrect) {
      return {
        statusCode: 400,
        body: {
          message: "Old password is incorrect",
        },
      };
    }

    const isSamePassword =
      await bcrypt.compare(
        newPassword,
        user.password
      );

    if (isSamePassword) {
      return {
        statusCode: 400,
        body: {
          message:
            "New password cannot be the same as the current password",
        },
      };
    }

    const hashedPassword =
      await bcrypt.hash(
        newPassword,
        12
      );

    const affectedRows =
      await User.updatePassword(
        userId,
        hashedPassword
      );

    if (!affectedRows) {
      return {
        statusCode: 500,
        body: {
          message: "Failed to update password",
        },
      };
    }

    return {
      statusCode: 200,
      body: {
        message: "Password changed successfully",
      },
    };

  } catch (error) {

    console.error("Change Password Service Error:", error);

    return {
      statusCode: 500,
      body: {
        message: "Internal Server Error",
      },
    };

  }
};