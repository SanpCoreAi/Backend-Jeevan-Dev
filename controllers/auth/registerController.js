const authService = require("../../services/auth/registerService");

const {registerValidation, verifyEmailValidation, getUsersValidation, getUserByDoctorIdValidation,}=require("../../validation/auth/userValidator");

exports.register = async (req, res) => {
  try {
    const error = registerValidation(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error,
      });
    }

    const result = await authService.registerUserOrAssistant(req.body);

    return res.status(result.statusCode).json({
      success: result.statusCode < 400,
      message: result.body.message,
      data: {
        user_id: result.body.user_id || null,
      },
    });

  } catch (error) {
    console.error("Register Error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};


exports.verifyEmail = async (req, res) => {
  try {
    const error = verifyEmailValidation(req.query);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error,
      });
    }

    const result = await authService.verifyEmail(req.query.token);

    return res.status(result.statusCode).json({
      success: result.statusCode < 400,
      message: result.body.message,
    });

  } catch (error) {
    console.error("Verify Email Error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

exports.getUserByDoctorId = async (req, res) => {
  try {
    const error = getUserByDoctorIdValidation(req.params);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error,
      });
    }

    const result = await authService.getUserByDoctorId(req.params.doctorId);

    return res.status(result.statusCode).json({
      success: result.statusCode < 400,
      message: result.body.message,
      count: result.body.results || 0,
      data: result.body.data || [],
    });

  } catch (error) {
    console.error("GetUserByDoctorId Error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

exports.getUsers = async (req, res) => {
  try {
    const error = getUsersValidation(req.query);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error,
      });
    }

    const filters = {
      doctor_id: req.query.doctor_id,
      role_id: req.query.role_id,
      email: req.query.email,
      name: req.query.name,
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 10,
    };

    const result = await authService.getUsers(filters);

    return res.status(result.statusCode).json({
      success: result.statusCode < 400,
      message: result.body.message,
      count: result.body.results || 0,
      data: result.body.data || [],
    });

  } catch (error) {
    console.error("GetUsers Error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};