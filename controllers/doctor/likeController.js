const {
  toggleLike,
  getLikedDoctorsService,
  getUserByToken
} = require("../../services/doctor/likeService");

// 🔥 TOGGLE LIKE
const toggleLikeController = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { doctorId } = req.body;

    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    if (!doctorId) {
      return res.status(400).json({ success: false, message: "Doctor ID is required" });
    }

    const result = await toggleLike(userId, doctorId);
    return res.status(200).json(result);

  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false });
  }
};

// 🔥 GET LIKED DOCTORS
const getLikedDoctorsController = async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ success: false });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const result = await getLikedDoctorsService(userId, page, limit);
    return res.status(200).json(result);

  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false });
  }
};

// 🔥 GET USER BY TOKEN
const getUserByTokenController = async (req, res) => {
  try {
    const token = req.params.token;

    const user = await getUserByToken(token);

    if (!user) {
      return res.status(404).json({ success: false, message: "Invalid token" });
    }

    return res.status(200).json({ success: true, data: user });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false });
  }
};

module.exports = {
  toggleLikeController,
  getLikedDoctorsController,
  getUserByToken: getUserByTokenController
};