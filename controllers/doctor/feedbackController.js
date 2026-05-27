const FeedbackService = require("../../services/doctor/feedbackService");

async function createFeedback(req, res) {
  const userId = req.user?.id;
  const doctorId = Number(req.params.doctorId);

  const result = await FeedbackService.createFeedback(
    userId,
    doctorId,
    req.body
  );

  return res
    .status(result.success ? 201 : 400)
    .json(result);
}

async function getAllFeedbacks(req, res) {
  const result = await FeedbackService.getAllFeedbacks();

  return res
    .status(result.success ? 200 : 404)
    .json(result);
}

async function getAllDoctorsRatings(req, res) {
  const result = await FeedbackService.getAllDoctorsRatings();

  return res
    .status(result.success ? 200 : 404)
    .json(result);
}

async function getDoctorFeedbacks(req, res) {
  const doctorId = Number(req.params.doctor_id);

  const result = await FeedbackService.getDoctorFeedbacks(doctorId);

  return res
    .status(result.success ? 200 : 404)
    .json(result);
}

async function createDoctorReply(req, res) {
  const doctorId = req.user?.id;

  const result = await FeedbackService.createDoctorReply(
    doctorId,
    req.body
  );

  return res
    .status(result.success ? 201 : 400)
    .json(result);
}

module.exports = {
  createFeedback,
  getAllFeedbacks,
  getAllDoctorsRatings,
  getDoctorFeedbacks,
  createDoctorReply
};
