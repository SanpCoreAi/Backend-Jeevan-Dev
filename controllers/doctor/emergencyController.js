const {
  sendEmergencyService,
  getUserEmergenciesService,
} = require("../../services/doctor/emergencyService");

const {
  sendEmergencyValidation,
  getUserEmergenciesValidation,
} = require("../../validation/doctor/emergencyValidation");

exports.sendEmergency = async (req, res) => {
  try {

    const { error } =
      sendEmergencyValidation.validate(req.body);

    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
    }

    const {
      doctor_id,
      role_id,
      message,
    } = req.body;

    const result =
      await sendEmergencyService(
        doctor_id,
        role_id,
        message
      );

    if (!result.success) {
      return res.status(result.statusCode).json({
        success: false,
        message: result.message,
      });
    }

    const io = req.app.get("io");

    result.data.forEach((item) => {

      io.to(`user_${item.target_user_id}`).emit(
        "receiveEmergency",
        {
          emergency_id: item.id,
          from_user: item.doctor_id,
          from_role:
            item.role_id === 2
              ? "Doctor"
              : "Assistant",
          message: item.message,
          created_at: item.created_at,
        }
      );

    });

    return res.status(result.statusCode).json({
      success: true,
      message: result.message,
      token:
        req.headers.authorization?.split(" ")[1] ||
        null,
      data: result.data,
    });

  } catch (error) {

    console.error(
      "Send Emergency Controller Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Internal Server Error.",
    });

  }
};


exports.getUserEmergencies = async (req, res) => {
  try {

    const { error } =
      getUserEmergenciesValidation.validate(
        req.params
      );

    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
    }

    const { doctor_id } = req.params;

    const result =
      await getUserEmergenciesService(
        doctor_id
      );

    if (!result.success) {
      return res.status(result.statusCode).json({
        success: false,
        message: result.message,
      });
    }

    return res.status(result.statusCode).json({
      success: true,
      message: result.message,
      token:
        req.headers.authorization?.split(" ")[1] ||
        null,
      data: result.data,
    });

  } catch (error) {

    console.error(
      "Get User Emergencies Controller Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Internal Server Error.",
    });

  }
};