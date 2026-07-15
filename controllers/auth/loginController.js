const { loginUser } = require("../../services/auth/loginService");
const { loginValidation } = require("../../validation/auth/loginValidator");

exports.login = async (req, res) => {
  try {

    const validationError = loginValidation(req.body);

    if (validationError) {
      return res.status(400).json({
        success: false,
        message: validationError,
      });
    }

    const credentials = {
      email: req.body.email.trim().toLowerCase(),
      password: req.body.password.trim(),
    };

    const result = await loginUser(credentials);

    return res.status(result.statusCode).json({
      success: result.statusCode < 400,
      message: result.body.message,
      data: result.body.data || null,
    });

  } catch (error) {

    console.error("Login Controller Error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });

  }
};