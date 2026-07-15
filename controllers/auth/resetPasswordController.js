const resetPasswordService = require("../../services/auth/resetPasswordService");

const {
  resetPasswordValidation,
} = require("../../validation/auth/passwordValidator");

exports.resetPassword = async (req, res) => {
  try {

    // Validate Request
    const validationError =
      resetPasswordValidation(req.body);

    if (validationError) {
      return res.status(400).json({
        success: false,
        message: validationError,
      });
    }

    // Sanitize Input
    const token = req.body.token.trim();
    const password = req.body.password.trim();

    // Service
    const result =
      await resetPasswordService.resetPassword(
        token,
        password
      );

    return res.status(result.statusCode).json({
      success: result.statusCode < 400,
      message: result.body.message,
    });

  } catch (error) {

    console.error(
      "Reset Password Controller Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });

  }
};