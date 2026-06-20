const express = require("express");
const router = express.Router();
const FeedbackController = require("../controllers/doctor/feedbackController");
const { verifyToken } = require("../middlewares/authMiddleware");

router.post("/patient/:doctorId", verifyToken, FeedbackController.createFeedback);
router.get("/", verifyToken, FeedbackController.getAllFeedbacks);
router.get("/ratings", FeedbackController.getAllDoctorsRatings);
router.get("/doctor/:doctor_id", verifyToken, FeedbackController.getDoctorFeedbacks);
// router.post("/doctor/reply", verifyToken, FeedbackController.createDoctorReply);

module.exports = router;