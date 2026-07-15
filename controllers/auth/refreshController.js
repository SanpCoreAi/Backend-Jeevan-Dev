const authService = require("../../services/auth/refreshTokenService");

const {
  refreshTokenValidation,
} = require("../../validation/auth/refreshTokenValidator");

exports.refreshTokenController = async (req, res) => {
  try {
    const validationError =
      refreshTokenValidation(req.body);

    if (validationError) {
      return res.status(400).json({
        success: false,
        message: validationError,
      });
    }

    const refreshToken =
      req.body.refreshToken.trim();

    const result =
      await authService.refreshToken(
        refreshToken
      );

    return res.status(result.statusCode).json({

      success:
        result.statusCode < 400,

      message:
        result.body.message,

      data: {
        accessToken:
          result.body.accessToken || null,
        refreshToken:
          result.body.refreshToken || null
      }

    });

  } catch (error) {

    console.error(
      "Refresh Token Controller Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Internal Server Error"

    });

  }
};