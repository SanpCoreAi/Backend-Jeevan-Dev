const crypto = require("crypto");
const User = require("../../models/usermodel");
const {sendResetPasswordEmail,} = require("../../utils/sendEmail");

exports.forgotPassword = async (email) => {

  try {

    if (!process.env.JWT_REFRESH_SECRET) {
      throw new Error(
        "RESET_PASSWORD_SECRET is missing"
      );
    }

    const user =
      await User.findByEmail(email);

    if (!user) {
      return {
        statusCode: 200,
        body: {
          message:
            "If the email exists, a password reset link has been sent.",
        },
      };
    }

    if (
      user.status &&
      user.status !== "ACTIVE"
    ) {
      return {
        statusCode: 200,
        body: {
          message:
            "If the email exists, a password reset link has been sent.",
        },
      };
    }

    const resetToken =
      crypto.randomBytes(32).toString("hex");

    const tokenHash =
      crypto
        .createHash("sha256")
        .update(resetToken)
        .digest("hex");

    const expiry =
      new Date(Date.now() + 15 * 60 * 1000);

    await User.saveResetToken(
      user.id,
      tokenHash,
      expiry
    );

    await sendResetPasswordEmail(
      email,
      resetToken
    );

    return {
      statusCode: 200,
      body: {
        message:
          "If the email exists, a password reset link has been sent.",
      },
    };

  } catch (error) {

    console.error(
      "Forgot Password Service Error:",
      error
    );

    return {
      statusCode: 500,
      body: {
        message:
          "Internal Server Error",
      },
    };

  }

};