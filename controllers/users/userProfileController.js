const userProfileService = require("../../services/users/userProfileService");
const appointmentService = require("../../services/doctor/appointmentService");

const {
  validateUserProfile,
} = require("../../validation/user/userProfile");

const getDoctorIdFromUser = async (user) => {
  if (user.role === 2) {
    return user.id;
  }

  if (user.role === 3) {
    const assistant = await appointmentService.getUserById(user.id);

    if (!assistant || !assistant.doctor_id) {
      return null;
    }

    return assistant.doctor_id;
  }

  return false;
};

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
    const appointmentId = Number(req.params.appointmentId);
    const role = Number(req.user.role);

    if (
      !appointmentId ||
      !Number.isInteger(appointmentId) ||
      appointmentId <= 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Valid appointment ID is required."
      });
    }

    if (role !== 2 && role !== 3) {
      return res.status(403).json({
        success: false,
        message: "Access denied."
      });
    }

    const doctorId = await getDoctorIdFromUser(req.user);

    if (doctorId === false) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized role."
      });
    }

    if (!doctorId) {
      return res.status(404).json({
        success: false,
        message: "Doctor not found."
      });
    }

    const result =
      await userProfileService.getPatientDetails(
        doctorId,
        appointmentId
      );

    return res.status(result.statusCode).json({
      success: result.success,
      message: result.message,
      data: result.data || null
    });

  } catch (error) {

    console.error(
      "Get Patient Details Controller Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Internal Server Error."
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