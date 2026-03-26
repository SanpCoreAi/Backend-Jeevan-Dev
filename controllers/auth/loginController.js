const AppError = require("../../utils/appError");
const { loginUser } = require("../../services/auth/loginService");

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        statusCode: 400,
        message: "Email and password are required.",
      });
    }

    const result = await loginUser({ email, password });
    if (!result || !result.body || !result.body.accessToken) {
      return res.status(401).json({
        success: false,
        statusCode: 401,
        message: "Invalid email or password.",
      });
    }

    return res.status(result.statusCode || 201).json({
  success: true,
  message: result.body.message,
  accessToken: result.body.accessToken,
  refreshToken: result.body.refreshToken,
  user: result.body.user,
});

  }catch (error) {
  console.error("Error (login):", error);

  if (error instanceof AppError) {
    return res.status(error.statusCode).json({
      success: false,
      statusCode: error.statusCode,
      message: error.message,
    });
  }

  return res.status(500).json({
    success: false,
    statusCode: 500,
    message: "Internal Server Error",
  });
  }
};