const jwt = require("jsonwebtoken");
const User = require("../../models/usermodel");
const { sendResetPasswordEmail } = require("../../utils/sendEmail");

exports.forgotPassword = async (email) => {
  try {
    const user = await User.findByEmail(email);

    if (!user) {
      return {
        statusCode: 200,
        body: {
          message: "If email exists, reset link sent",
        },
      };
    }

    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET,
      { expiresIn: "15m" }
    );

   await sendResetPasswordEmail(email, token).catch((err) => {
  console.error("EMAIL ERROR:", err);
});

    return {
      statusCode: 200,
      body: {
        message: "Reset link sent successfully",
      },
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: {
        message: error.message,
      },
    };
  }
};