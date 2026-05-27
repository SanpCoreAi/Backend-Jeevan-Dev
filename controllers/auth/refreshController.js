const authService = require("../../services/auth/refreshTokenService");

exports.refreshTokenController = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        message: "Refresh token is required",
      });
    }

    const result = await authService.refreshToken(refreshToken);

    return res.status(result.statusCode).json({
      success: result.statusCode < 400,
      message: result.body.message,
      data: {
        accessToken: result.body.accessToken || null,
      },
    });

  } catch (error) {
    console.error("Refresh Token Error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};