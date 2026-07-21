const userProfileService = require("../../services/users/userProfileService");

const {
  validateUserProfile,
} = require("../../validation/user/userProfile");

exports.getUserProfile = async (req, res) => {
  try {
    const userId = Number(req.user?.id);

    if (!Number.isInteger(userId) || userId <= 0) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized user.",
        data: null,
      });
    }

    const result =
      await userProfileService.getUserProfile(userId);

    return res.status(result.statusCode).json({
      success: result.statusCode < 400,
      message: result.body.message,
      data: result.body.data || null,
    });

  } catch (error) {
    console.error("GET USER PROFILE ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      data: null,
    });
  }
};

exports.updateUserProfile = async (req, res) => {
  try {
    const userId = Number(req.user?.id);

    if (!Number.isInteger(userId) || userId <= 0) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized user.",
      });
    }

    const validationError =
      validateUserProfile(req.body);

    if (validationError) {
      return res.status(400).json({
        success: false,
        message: validationError,
      });
    }

    const result =
      await userProfileService.updateUserProfile(
        userId,
        req.body
      );

    return res.status(result.statusCode).json({
      success: result.success,
      message: result.message,
      data: result.data || null,
    });

  } catch (error) {
    console.error("UPDATE USER PROFILE ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

exports.getPatientCardProfile = async (req, res) => {
  try {

    const doctorId = Number(req.user?.id);
    const patientId = Number(req.params.patientId);

    if (!doctorId || doctorId <= 0) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized user."
      });
    }

    if (!patientId || patientId <= 0) {
      return res.status(400).json({
        success: false,
        message: "Patient id is required."
      });
    }

    const result =
      await userProfileService.getPatientCardProfile(
        doctorId,
        patientId
      );

    return res.status(result.statusCode).json({
      success: result.success,
      message: result.body.message,
      data: result.body.data || null
    });

  } catch (error) {

    console.error(
      "GET PATIENT CARD ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      data: null
    });

  }
};

exports.getPatientDetails = async (req, res) => {
  try {

    const doctorId = Number(req.user.id);
    const appointmentId = Number(req.params.appointmentId);

    if (!doctorId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized"
      });
    }

    if (!appointmentId) {
      return res.status(400).json({
        success: false,
        message: "Appointment id is required"
      });
    }

    const result =
      await userProfileService.getPatientDetails(
        doctorId,
        appointmentId
      );

    return res.status(result.statusCode).json({
      success: result.success,
      message: result.body.message,
      data: result.body.data || null
    });

  } catch (error) {

    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error"
    });

  }
};

exports.getAllUsers = async (req, res) => {
  try {

    const result =
      await userProfileService.getAllUsers();

    return res.status(result.statusCode).json({
      success: result.success,
      message: result.body.message,
      count: result.body.count,
      data: result.body.data
    });

  } catch (error) {

    console.error(
      "GET ALL USERS ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      count: 0,
      data: []
    });

  }
};