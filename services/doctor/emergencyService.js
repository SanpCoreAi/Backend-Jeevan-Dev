const Emergency = require("../../models/emergencyModel");

exports.sendEmergencyService = async (
  doctor_id,
  role_id,
  message
) => {
  try {

    if (!doctor_id || !role_id || !message) {
      return {
        success: false,
        statusCode: 400,
        message:
          "doctor_id, role_id and message are required.",
      };
    }

    const targetUsers =
      await Emergency.findTargetUser(
        doctor_id,
        role_id
      );

    if (!targetUsers || targetUsers.length === 0) {
      return {
        success: false,
        statusCode: 404,
        message:
          "No target users found for this emergency.",
      };
    }

    const savedRecords = [];

    for (const target_user_id of targetUsers) {

      const id =
        await Emergency.insertEmergency(
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
      message:
        "Emergency message sent successfully.",
      count: savedRecords.length,
      data: savedRecords,
    };

  } catch (error) {

    console.error(
      "Send Emergency Service Error:",
      error
    );

    return {
      success: false,
      statusCode: 500,
      message: "Internal Server Error.",
    };

  }
};

exports.getUserEmergenciesService = async (doctor_id) => {
  try {

    if (!doctor_id) {
      return {
        success: false,
        statusCode: 400,
        message: "Doctor ID is required.",
      };
    }

    const emergencies =
      await Emergency.getEmergenciesByUser(
        doctor_id
      );

    if (!emergencies || emergencies.length === 0) {
      return {
        success: false,
        statusCode: 404,
        message:
          "No emergency records found for this user.",
      };
    }

    return {
      success: true,
      statusCode: 200,
      message:
        "User emergencies fetched successfully.",
      count: emergencies.length,
      data: emergencies,
    };

  } catch (error) {

    console.error(
      "Get User Emergencies Service Error:",
      error
    );

    return {
      success: false,
      statusCode: 500,
      message: "Internal Server Error.",
    };

  }
};