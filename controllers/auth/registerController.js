const { registerUserOrAssistant, verifyEmail, getUsers,} = require("../../services/auth/registerService");
const userService = require("../../services/auth/registerService");
const userModel = require("../../models/usermodel");

exports.register = async (req, res) => {
  try {
    const result = await registerUserOrAssistant(req.body);

    return res.status(201).json({
      success: true,
      statusCode: 201,
      message: result.body.message || "User registered successfully.",
      user_id: result.body.user_id,
    });
    
  } catch (error) {
    console.error(" Error (register):", error);
    return res.status(500).json({
      success: false,
      statusCode: 500,
      message: error.message || "Internal Server Error while registering user.",
    });
  }
};

exports.verifyEmail = async (req, res) => {
  try {
    const { token } = req.query;

    if (!token) {
      return res.status(400).json({
        success: false,
        statusCode: 400,
        message: "Verification token missing.",
      });
    }

    console.log(" Verifying email with token:", token);
    const result = await verifyEmail(token);

    return res.status(200).json({
      success: true,
      statusCode: 200,
      message: result.body.message || "Email verified successfully.",
    });
    
  } catch (error) {
    console.error(" Error (verifyEmail):", error);
    return res.status(500).json({
      success: false,
      statusCode: 500,
      message: error.message || "Internal Server Error while verifying email.",
    });
  }
};

exports.getUserByDoctorId = async (req, res) => {
  try {
    const { doctorId } = req.params;

    if (!doctorId) {
      return res.status(400).json({
        success: false,
        message: "doctor_id is required.",
      });
    }

    const users = await userService.getUserByDoctorId(doctorId);

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No user found.",
      });
    }

    return res.status(200).json({
      success: true,
      data: users,
    });

  } catch (error) {
    console.error(" Error (getUserByDoctorId):", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error.",
    });
  }
};

exports.getUserByDoctorIdService = async (doctor_id) => {
  const users = await userModel.findByDoctorId(doctor_id);
  return users;
};

exports.getUsers = async (req, res) => {
  try {
    const filters = {
      doctor_id: req.query.doctor_id || null,
      role_id: req.query.role_id || null,
      email: req.query.email || null,
      name: req.query.name || null,
    };

    const result = await getUsers(filters);
    const users = result.body.data || [];

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        statusCode: 404,
        message: "No users found with the given filters.",
      });
    }

    return res.status(200).json({
      success: true,
      statusCode: 200,
      message: result.body.message || "Users retrieved successfully.",
      count: result.body.results || users.length,
      data: users,
    });

  } catch (error) {
    console.error(" Error (getUsers):", error);
    return res.status(500).json({
      success: false,
      statusCode: 500,
      message: error.message || "Internal Server Error while fetching users.",
    });
  }
};