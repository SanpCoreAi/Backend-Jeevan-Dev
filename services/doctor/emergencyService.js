const Emergency = require("../../models/emergencyModel");

exports.sendEmergencyService = async (doctor_id, role_id, message) => {
  try {
    if (!doctor_id || !role_id || !message) {
      const err = new Error("doctor_id, role_id, and message are required.");
      err.statusCode = 400;
      throw err;
    }

    const targetUsers = await Emergency.findTargetUser(doctor_id, role_id);

    if (!targetUsers || targetUsers.length === 0) {
      const err = new Error("No target users found for this emergency.");
      err.statusCode = 404;
      throw err;
    }

    const savedRecords = [];

    for (const target_user_id of targetUsers) {
      const id = await Emergency.insertEmergency(
        doctor_id,
        role_id,
        target_user_id,
        message
      );

      savedRecords.push({
        id,
        doctor_id,
        role_id,
        target_user_id,
        message,
        created_at: new Date(),
      });
    }

    return {
      success: true,
      statusCode: 201,
      message: "Emergency message sent successfully.",
      count: savedRecords.length,
      data: savedRecords,
    };

  } catch (error) {
    console.error("Service Error (sendEmergencyService):", error);
    const err = new Error(error.message || "Internal server error while sending emergency.");
    err.statusCode = error.statusCode || 500;
    throw err;
  }
};


exports.getUserEmergenciesService = async (doctor_id) => {
  try {
    if (!doctor_id) {
      const err = new Error("Doctor ID is required.");
      err.statusCode = 400;
      throw err;
    }

    const emergencies = await Emergency.getEmergenciesByUser(doctor_id);

    if (!emergencies || emergencies.length === 0) {
      const err = new Error("No emergency records found for this user.");
      err.statusCode = 404;
      throw err;
    }

    return {
      success: true,
      statusCode: 200,
      message: "User emergencies fetched successfully.",
      count: emergencies.length,
      data: emergencies,
    };

  } catch (error) {
    console.error("Service Error (getUserEmergenciesService):", error);
    const err = new Error(error.message || "Internal server error while fetching user emergencies.");
    err.statusCode = error.statusCode || 500;
    throw err;
  }
};
