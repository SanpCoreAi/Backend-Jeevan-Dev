const forgotPasswordService = require("../../services/auth/forgotPasswordService");

const {forgotPasswordValidation,} = require("../../validation/auth/passwordValidator");

exports.forgotPassword = async (req, res) => {
  try {

    const validationError =
      forgotPasswordValidation(req.body);

    if (validationError) {
      return res.status(400).json({
        success: false,
        message: validationError,
      });
    }

    const email = req.body.email
      .trim()
      .toLowerCase();

    const result =
      await forgotPasswordService.forgotPassword(email);

    return res.status(result.statusCode).json({
      success: result.statusCode < 400,
      message: result.body.message,
    });

  } catch (error) {

    console.error(
      "Forgot Password Controller Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });

  }
};