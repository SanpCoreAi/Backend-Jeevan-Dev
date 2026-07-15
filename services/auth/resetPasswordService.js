const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

const User = require("../../models/usermodel");

exports.resetPassword = async (
  token,
  password
) => {

  try {

    if (!process.env.RESET_PASSWORD_SECRET) {
      throw new Error(
        "RESET_PASSWORD_SECRET is missing"
      );
    }

    const decoded =
      jwt.verify(
        token,
        process.env.RESET_PASSWORD_SECRET
      );

    const user =
      await User.findById(decoded.userId);

    if (!user) {

      return {
        statusCode:404,
        body:{
          message:"User not found"
        }

      };

    }

    if (
      user.status &&
      user.status !== "ACTIVE"
    ) {

      return {

        statusCode:403,

        body:{
          message:"Your account is inactive"
        }

      };

    }

    const isSamePassword =
      await bcrypt.compare(
        password,
        user.password
      );

    if (isSamePassword) {

      return {

        statusCode:400,

        body:{
          message:
          "New password cannot be the same as the current password"
        }

      };

    }

    const hashedPassword =
      await bcrypt.hash(
        password,
        12
      );

    const affectedRows =
      await User.updatePassword(
        user.id,
        hashedPassword
      );

    if (!affectedRows) {

      return {
        statusCode:500,
        body:{
          message:"Failed to update password"
        }

      };

    }

    return {
      statusCode:200,
      body:{
        message:"Password reset successfully"
      }

    };

  } catch (error) {

    console.error(
      "Reset Password Service Error:",
      error
    );

    return {

      statusCode:400,
      body:{
        message:"Invalid or expired token"
      }
    };
  }
};