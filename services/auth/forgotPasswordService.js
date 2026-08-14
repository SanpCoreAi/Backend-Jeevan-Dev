const crypto = require("crypto");

const User = require("../../models/usermodel");
const {
  sendResetPasswordEmail,
} = require("../../utils/sendEmail");

exports.forgotPassword = async (email) => {
  try {

    const user = await User.findByEmail(email);

    if (!user) {

      return {
        statusCode: 200,
        body: {
          success: true,
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
      new Date(
        Date.now() + 15 * 60 * 1000
      );

    await User.saveResetToken(
      user.id,
      tokenHash,
      expiry
    );

    try {
      await sendResetPasswordEmail(
        email,
        resetToken
      );



    } catch (emailError) {

      console.error(
        "❌ Email Send Error:",
        emailError.message || emailError
      );

      return {
        statusCode: 500,
        body: {
          success: false,
          message:
            "Failed to send reset email. Please try again later.",
        },
      };
    }

    return {
      statusCode: 200,
      body: {
        success: true,
        message:
          "If the email exists, a password reset link has been sent.",
      },
    };

  } catch (error) {

    console.error(
      "❌ Forgot Password Service Error:",
      error.message || error
    );

    return {
      statusCode: 500,
      body: {
        success: false,
        message:
          "Internal Server Error.",
      },
    };
  }
};