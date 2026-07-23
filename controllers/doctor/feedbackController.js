const FeedbackService = require("../../services/doctor/feedbackService");
const {
  createFeedbackValidation,
} = require("../../validation/doctor/feedbackValidator");

exports.createFeedback = async (req, res) => {
  try {
    const userId = Number(req.user?.id);
    const doctorId = Number(req.params.doctorId);

    if (!Number.isInteger(userId) || userId <= 0) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized user.",
      });
    }

    if (!Number.isInteger(doctorId) || doctorId <= 0) {
      return res.status(400).json({
        success: false,
        message: "Valid doctor id is required.",
      });
    }

    const error = createFeedbackValidation(req.body);

    if (error) {
      return res.status(400).json({
        success: false,
        message: error,
      });
    }

    const result = await FeedbackService.createFeedback(
      userId,
      doctorId,
      req.body
    );

    return res.status(result.statusCode).json({
      success: result.statusCode < 400,
      message: result.body.message,
      data: result.body.data || null,
    });

  } catch (error) {

    console.error("CREATE FEEDBACK ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      data: null,
    });
  }
};

exports.getDoctorFeedbacks = async (req, res) => {
  try {

    const doctorId = Number(req.params.doctor_id);

    if (!Number.isInteger(doctorId) || doctorId <= 0) {
      return res.status(400).json({
        success: false,
        message: "Valid doctor id is required.",
      });
    }

    const result =
      await FeedbackService.getDoctorFeedbacks(doctorId);

    return res.status(result.statusCode).json({
      success: result.success,
      message: result.body.message,
      summary: result.body.summary || {},
      data: result.body.data || [],
    });

  } catch (error) {

    console.error("GET DOCTOR FEEDBACKS ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      summary: {},
      data: [],
    });
  }
};

exports.getAllFeedbacks = async (req, res) => {
  try {

    const result =
      await FeedbackService.getAllFeedbacks();

    return res.status(result.statusCode).json({
      success: result.statusCode < 400,
      message: result.body.message,
      data: result.body.data || [],
    });

  } catch (error) {

    console.error("GET ALL FEEDBACKS ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      data: [],
    });
  }
};

exports.getAllDoctorsRatings = async (req, res) => {
  try {

    const result =
      await FeedbackService.getAllDoctorsRatings();

    return res.status(result.statusCode).json({
      success: result.statusCode < 400,
      message: result.body.message,
      data: result.body.data || [],
    });

  } catch (error) {

    console.error("GET ALL DOCTOR RATINGS ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      data: [],
    });
  }
};