const { loginUser } = require("../../services/auth/loginService");

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    const result = await loginUser({ email, password });

    return res.status(result.statusCode).json({
      success: result.statusCode < 400,
      message: result.body.message,
      data: {
        accessToken: result.body.accessToken || null,
        refreshToken: result.body.refreshToken || null,
        user: result.body.user || null,
      },
    });

  } catch (error) {
    console.error("Login Error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};