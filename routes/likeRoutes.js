// routes/likeRoutes.js
const express = require("express");
const router = express.Router();

const likeController = require("../controllers/doctor/likeController");
const { verifyToken } = require("../middlewares/authMiddleware");

router.post("/toggle-like", verifyToken, likeController.toggleLikeController);
router.get("/liked-doctors", verifyToken, likeController.getLikedDoctorsController);

router.get("/get-user-by-token/:token", likeController.getUserByToken);

module.exports = router;