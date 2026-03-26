const { sendEmergencyService, getUserEmergenciesService,} = require("../../services/doctor/emergencyService");

exports.sendEmergency = async (req, res) => {
  try {
    const { doctor_id, role_id, message } = req.body;

    if (!doctor_id || !role_id || !message) {
      return res.status(400).json({
        success: false,
        statusCode: 400,
        message: "doctor_id, role_id, and message are required.",
      });
    }

    const results = await sendEmergencyService(doctor_id, role_id, message);

    if (!results.data || results.data.length === 0) {
      return res.status(404).json({
        success: false,
        statusCode: 404,
        message: "No target users found for this emergency.",
      });
    }

    const io = req.app.get("io");

    results.data.forEach((result) => {
      io.to(`user_${result.target_doctor_id}`).emit("receiveEmergency", {
        from_user: result.doctor_id,
        from_role: role_id === 2 ? "Doctor" : "Assistant",
        message: result.message,
        emergency_id: result.id,
        created_at: result.created_at,
      });
    });

    return res.status(201).json({
      success: true,
      statusCode: 201,
      message: "Emergency message sent successfully to target users.",
      token: req.headers["authorization"]?.split(" ")[1] || null,
      data: results.data,  
    });

  } catch (err) {
    console.error("Error in sendEmergency:", err.message);
    return res.status(err.statusCode || 500).json({
      success: false,
      statusCode: err.statusCode || 500,
      message: err.message || "Internal server error",
    });
  }
};

exports.getUserEmergencies = async (req, res) => {
  try {
    const { doctor_id } = req.params;

    if (!doctor_id) {
      return res.status(400).json({
        success: false,
        statusCode: 400,
        message: "Doctor ID is required.",
      });
    }

    const emergencies = await getUserEmergenciesService(doctor_id);

    return res.status(200).json({
      success: true,
      statusCode: 200,
      message: "User emergencies fetched successfully.",
      token: req.headers["authorization"]?.split(" ")[1] || null,
      data: emergencies.data,
    });

  } catch (err) {
    console.error("Error in getUserEmergencies:", err.message);
    return res.status(err.statusCode || 500).json({
      success: false,
      statusCode: err.statusCode || 500,
      message: err.message || "Internal server error",
    });
  }
};
