const authService = require("../../services/auth/registerService");
const { registerValidation, verifyEmailValidation, getUsersValidation,getUserByDoctorIdValidation,
} = require("../../validation/auth/userValidator");

exports.register = async (req, res) => {
  try {

    // Doctor Registration (Only Admin)
    if (req.body.role_id == 2) {

      if (!req.user || !req.user.id) {
        return res.status(401).json({
          success: false,
          message: "Admin token required",
        });
      }

      if (req.user.role_id != 4) {
        return res.status(403).json({
          success: false,
          message: "Only admin can create doctor",
        });
      }
    }

    // Assistant Registration (Only Doctor)
    if (req.body.role_id == 3) {

      if (!req.user || !req.user.id) {
        return res.status(401).json({
          success: false,
          message: "Doctor token required",
        });
      }

      if (req.user.role_id != 2) {
        return res.status(403).json({
          success: false,
          message: "Only doctor can create assistant",
        });
      }

      req.body.doctor_id = req.user.id;
    }

    // Admin Registration Not Allowed
    if (req.body.role_id == 4) {
      return res.status(403).json({
        success: false,
        message: "Admin cannot be registered from this API",
      });
    }

    // Default Role = User
    if (!req.body.role_id) {
      req.body.role_id = 1;
    }

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

    console.error("Register Error:", error);

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

    const result = await authService.getUserByDoctorId(
      req.params.doctorId
    );

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

exports.getUserByDoctorAssistant = async (req, res) => {
  try {

    const doctor_id = req.user?.doctor_id || req.user?.id;

    if (!doctor_id) {
      return res.status(400).json({
        success: false,
        message: "Doctor id not found in token",
      });
    }

    const result = await authService.getUserByDoctorId(doctor_id);

    return res.status(result.statusCode).json({
      success: result.statusCode < 400,
      message: result.body.message,
      count: result.body.results || 0,
      data: result.body.data || [],
    });

  } catch (error) {
    console.error("GetUserByDoctorAssistant Error:", error.message);

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

exports.getAssistantStats = async (req, res) => {
  try {
    const doctorId = req.user?.doctor_id || req.user?.id;

    if (!doctorId) {
      return res.status(400).json({
        success: false,
        message: "Doctor id not found in token",
      });
    }

    const result = await authService.getAssistantStats(doctorId);

    return res.status(result.statusCode).json({
      success: result.statusCode < 400,
      message: result.body.message,
      data: result.body.data,
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.resendVerificationEmail = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    const result = await authService.resendVerificationEmail(email);

    return res.status(result.statusCode).json({
      success: result.statusCode < 400,
      message: result.body.message,
    });

  } catch (error) {
    console.error("Resend Verification Email Error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};