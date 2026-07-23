const FeedbackModel = require("../../models/feedbackModel");
const xss = require("xss");

exports.createFeedback = async (userId, doctorId, body) => {
  try {

    if (!Number.isInteger(userId) || userId <= 0) {
      return {
        success: false,
        statusCode: 401,
        body: {
          message: "Unauthorized user."
        }
      };
    }

    if (!Number.isInteger(doctorId) || doctorId <= 0) {
      return {
        success: false,
        statusCode: 400,
        body: {
          message: "Valid doctor id is required."
        }
      };
    }

    let { feedback_text, rating } = body;

    feedback_text = xss(String(feedback_text || "").trim());

    rating =
      rating !== undefined && rating !== null
        ? Number(rating)
        : null;

    if (
      rating !== null &&
      (Number.isNaN(rating) || rating < 1 || rating > 5)
    ) {
      return {
        success: false,
        statusCode: 400,
        body: {
          message: "Rating must be between 1 and 5."
        }
      };
    }

    const alreadyExists =
      await FeedbackModel.checkUserFeedback(
        userId,
        doctorId
      );

    if (alreadyExists) {
      return {
        success: false,
        statusCode: 409,
        body: {
          message: "Feedback already submitted."
        }
      };
    }

    const feedbackId =
      await FeedbackModel.createFeedback(
        userId,
        doctorId,
        feedback_text,
        rating
      );

    return {
      success: true,
      statusCode: 201,
      body: {
        message: "Feedback created successfully.",
        data: {
          feedback_id: feedbackId
        }
      }
    };

  } catch (error) {

    console.error(
      "CREATE FEEDBACK SERVICE ERROR:",
      error
    );

    return {
      success: false,
      statusCode: 500,
      body: {
        message: "Internal Server Error"
      }
    };
  }
};

exports.getDoctorFeedbacks = async (doctorId) => {
  try {

    if (!Number.isInteger(doctorId) || doctorId <= 0) {
      return {
        success: false,
        statusCode: 400,
        body: {
          message: "Valid doctor id is required."
        }
      };
    }

    const feedbacks =
      await FeedbackModel.getDoctorFeedbacks(
        doctorId
      );

    if (!feedbacks.length) {
      return {
        success: true,
        statusCode: 200,
        body: {
          message: "No feedback found.",
          summary: {
            total_feedbacks: 0,
            total_ratings: 0,
            avg_rating: 0
          },
          data: []
        }
      };
    }

    const ratings = feedbacks.filter(
      item => item.rating !== null
    );

    const avgRating =
      ratings.length > 0
        ? (
            ratings.reduce(
              (sum, item) =>
                sum + Number(item.rating),
              0
            ) / ratings.length
          ).toFixed(1)
        : 0;

    return {
      success: true,
      statusCode: 200,
      body: {
        message:
          "Feedback fetched successfully.",
        summary: {
          total_feedbacks:
            feedbacks.length,
          total_ratings:
            ratings.length,
          avg_rating: avgRating
        },
        data: feedbacks
      }
    };

  } catch (error) {

    console.error(
      "GET DOCTOR FEEDBACK SERVICE ERROR:",
      error
    );

    return {
      success: false,
      statusCode: 500,
      body: {
        message: "Internal Server Error"
      }
    };
  }
};

exports.getAllFeedbacks = async () => {
  try {

    const feedbacks =
      await FeedbackModel.getAllFeedbacks();

    return {
      success: true,
      statusCode: 200,
      body: {
        message:
          "All feedback fetched successfully.",
        data: feedbacks
      }
    };

  } catch (error) {

    console.error(
      "GET ALL FEEDBACKS SERVICE ERROR:",
      error
    );

    return {
      success: false,
      statusCode: 500,
      body: {
        message: "Internal Server Error"
      }
    };
  }
};

exports.getAllDoctorsRatings = async () => {
  try {

    const ratings =
      await FeedbackModel.getAllDoctorsRatingSummary();

    return {
      success: true,
      statusCode: 200,
      body: {
        message:
          "Doctor ratings fetched successfully.",
        data: ratings
      }
    };

  } catch (error) {

    console.error(
      "GET ALL DOCTOR RATINGS SERVICE ERROR:",
      error
    );

    return {
      success: false,
      statusCode: 500,
      body: {
        message: "Internal Server Error"
      }
    };
  }
};