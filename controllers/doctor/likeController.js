const likeService = require("../../services/doctor/likeService");

exports.toggleLikeController = async (req, res) => {
  try {
    const userId = req.user && req.user.id;
    const doctorId = req.body.doctorId || req.body.doctor_id || req.query.doctorId;

    if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });
    if (!doctorId) return res.status(400).json({ success: false, message: "doctorId is required" });

    const result = await likeService.toggleLike(Number(userId), Number(doctorId));
    res.json(result);
  } catch (err) {
    console.error("Like Controller Error:", err);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

exports.getLikedDoctorsController = async (req, res) => {
  try {
    const userId = req.user && req.user.id;
    const page = req.query.page || 1;
    const limit = req.query.limit || 10;

    if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

    const result = await likeService.getLikedDoctorsService(Number(userId), page, limit);
    res.json(result);
  } catch (err) {
    console.error("Get Liked Doctors Error:", err);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

exports.getUserByToken = async (req, res) => {
  try {
    const token = req.params.token;
    if (!token) return res.status(400).json({ success: false, message: "token is required" });

    const user = await likeService.getUserByToken(token);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    res.json({ success: true, data: user });
  } catch (err) {
    console.error("Get User By Token Error:", err);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};