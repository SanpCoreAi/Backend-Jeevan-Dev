const forgotPasswordService = require(
  "../../services/auth/forgotPasswordService"
);

exports.forgotPassword = async (
  req,
  res
) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    const result =
      await forgotPasswordService
        .forgotPassword(email);

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