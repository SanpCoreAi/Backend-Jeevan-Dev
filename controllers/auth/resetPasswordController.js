const resetPasswordService = require(
  "../../services/auth/resetPasswordService"
);

exports.resetPassword = async (
  req,
  res
) => {
  try {
    const { token, password } =
      req.body;

    if (!token || !password) {
      return res.status(400).json({
        success: false,
        message:
          "Token and password are required",
      });
    }

    const result =
      await resetPasswordService
        .resetPassword(
          token,
          password
        );

    return res
      .status(result.statusCode)
      .json({
        success:
          result.statusCode === 200,
        ...result.body,
      });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};