const userProfileService = require("../../services/users/userProfileService");

exports.createUserProfile = async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized user"
      });
    }

    const result = await userProfileService.createProfile(userId, req.body);

    if (!result.success) {
      return res.status(result.statusCode || 400).json({
        success: false,
        message: result.message
      });
    }

    return res.status(201).json({
      success: true,
      message: result.message,
      data: result.data
    });

  } catch (error) {
    console.error("Create profile error:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error"
    });
  }
};
exports.getUserProfile = async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized user"
      });
    }

    const data = await userProfileService.getUserProfile(userId);

    if (!data) {
      return res.status(404).json({
        success: false,
        message: "Profile not found"
      });
    }

    return res.status(200).json({
      success: true,
      data
    });

  } catch (error) {
    console.error("Get profile error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};

exports.getPatientCardProfile = async (req, res) => {

  try {

    // Doctor ID from token
    const doctorId = req.user?.id;

    // Patient ID from params
    const patientId = req.params.patientId;

    if (!doctorId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized doctor"
      });
    }

    if (!patientId) {
      return res.status(400).json({
        success: false,
        message: "Patient id is required"
      });
    }

    const result =
      await userProfileService.getPatientCardProfile(
        doctorId,
        patientId
      );

    if (!result.success) {
      return res.status(result.statusCode).json(result);
    }

    return res.status(200).json(result);

  } catch (error) {

    console.error("Get patient card error:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error"
    });
  }
};

exports.updateUserProfile = async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized user"
      });
    }

    const result = await userProfileService.updateUserProfile(
      userId,
      req.body
    );

    if (!result.success) {
      return res.status(result.statusCode || 400).json(result);
    }

    return res.status(200).json(result);

  } catch (error) {
    console.error("Update profile error:", error);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};


exports.getPatientDetails = async (req, res) => {
  try {
    const doctorId = req.user.id;
    const { appointmentId } = req.params;

    const result = await userProfileService.getPatientDetails(
      doctorId,
      appointmentId
    );

    return res.status(result.statusCode).json({
      success: result.success,
      message: result.message,
      data: result.data || null,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

exports.getAllUsers = async (req, res) => {
  try {
    const result = await userProfileService.getAllUsers();

    return res.status(result.statusCode).json(result);
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};