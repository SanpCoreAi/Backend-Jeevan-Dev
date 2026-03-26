const FeedbackModel = require("../../models/feedbackModel");

async function createFeedback(userId, doctorId, body) {
  const { feedback_text, rating } = body || {};

  if (!userId) {
    return { 
      success: false, 
      message: "User not authenticated" 
    };
  }

  if (!doctorId) {
    return { 
      success: false, 
      message: "doctor_id is required" 
    };
  }

  if (!feedback_text) {
    return { 
      success: false, 
      message: "feedback_text is required" 
    };
  }

  if (rating !== undefined && (rating < 1 || rating > 5)) {
    return { 
      success: false, 
      message: "Rating must be between 1 and 5" 
    };
  }

  await FeedbackModel.createFeedback(
    userId,
    doctorId,
    feedback_text,
    rating ?? null
  );

  const allRatings = await FeedbackModel.getDoctorFeedbacks(doctorId);

  const total_feedbacks = allRatings.length;
  const total_ratings = allRatings.filter(
    f => f.rating !== null && f.rating !== undefined
  ).length;

  const avg_rating =
    total_ratings > 0
      ? (
          allRatings.reduce((sum, f) => sum + (f.rating || 0), 0) /
          total_ratings
        ).toFixed(1)
      : 0;

  await FeedbackModel.saveDoctorRatingSummary(
    doctorId,
    total_feedbacks,
    total_ratings,
    avg_rating
  );

  return {
    success: true,
    message: "Feedback created successfully"
  };
}

async function getAllFeedbacks() {
  const data = await FeedbackModel.getAllFeedbacks();

  if (!data || data.length === 0) {
    return { success: false, message: "No feedbacks found" };
  }

  return { success: true, data };
}

async function getDoctorFeedbacks(doctorId) {
  if (!doctorId) {
    return { success: false, message: "doctor_id is required" };
  }

  const feedbacks = await FeedbackModel.getDoctorFeedbacks(doctorId);

  if (!feedbacks || feedbacks.length === 0) {
    return { success: false, message: "No feedback found for this doctor" };
  }

  const total_feedbacks = feedbacks.length;

  // ✅ valid ratings alag nikalo
  const validRatings = feedbacks.filter(
    f => f.rating !== null && f.rating !== undefined
  );

  const total_ratings = validRatings.length;

  const avg_rating =
    total_ratings > 0
      ? (
          validRatings.reduce((sum, f) => sum + f.rating, 0) /
          total_ratings
        ).toFixed(1)
      : 0;

  // ✅ positive / negative logic
  const positive_feedbacks = validRatings.filter(f => f.rating > 3).length;
  const negative_feedbacks = validRatings.filter(f => f.rating <= 3).length;

  return {
    success: true,
    summary: { 
      total_feedbacks, 
      total_ratings, 
      avg_rating,
      positive_feedbacks,
      negative_feedbacks
    },
    feedbacks
  };
}

async function getAllDoctorsRatings() {
  const data = await FeedbackModel.getAllDoctorsRatingSummary();

  if (!data || data.length === 0) {
    return { success: false, message: "No ratings found" };
  }

  return { success: true, data };
}

async function createDoctorReply(doctorId, body) {
  const { feedback_id, reply_text } = body || {};

  if (!doctorId) {
    return { success: false, message: "Doctor not authenticated" };
  }

  if (!feedback_id || !reply_text) {
    return {
      success: false,
      message: "feedback_id and reply_text are required"
    };
  }

  await FeedbackModel.createDoctorReply(
    feedback_id,
    doctorId,
    reply_text
  );

  return {
    success: true,
    message: "Doctor reply added successfully"
  };
}

module.exports = {
  createFeedback,
  getAllFeedbacks,
  getDoctorFeedbacks,
  getAllDoctorsRatings,
  createDoctorReply
};
