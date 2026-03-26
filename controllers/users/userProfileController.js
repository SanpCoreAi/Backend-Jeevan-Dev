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


exports.getUserProfile = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized user"
      });
    }

    const profile = await userProfileService.getProfile(userId);

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: "User profile not found"
      });
    }

    return res.status(200).json({
      success: true,
      data: profile
    });

  } catch (error) {
    console.error("Get profile error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch user profile",
      error: error.message
    });
  }
};
