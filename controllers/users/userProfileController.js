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

    await userProfileService.createProfile(userId, req.body);

    return res.status(201).json({
      success: true,
      message: "User profile created successfully"
    });

  } catch (error) {
    console.error("Create profile error:", error);
    return res.status(500).json({
      success: false,
      message: "Profile creation failed",
      error: error.message
    });
  }
};

exports.getPatientDetails = async (req, res) => {
  try {
    const patientId = req.user.id;

    const data = await userProfileService.getPatientDetails(patientId);

    if (!data) {
      return res.status(404).json({
        success: false,
        message: "Patient not found"
      });
    }

    return res.status(200).json({
      success: true,
      data
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};


exports.createUserProfile = async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized user"
      });
    }

    await userProfileService.createProfile(userId, req.body);

    return res.status(201).json({
      success: true,
      message: "User profile created successfully"
    });

  } catch (error) {
    console.error("Create profile error:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Profile creation failed"
    });
  }
};