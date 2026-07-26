const { findDoctors } = require("../../models/getdoctorModel");
const FeedbackModel = require("../../models/feedbackModel");

exports.getDoctorsService = async (filters = {}) => {
  try {

    const doctors = await findDoctors(filters);

    if (!doctors.length) {
      return {
        success: true,
        statusCode: 200,
        message: "No doctors found.",
        count: 0,
        data: []
      };
    }

    const ratings =
      await FeedbackModel.getAllDoctorsRatingSummary();

const ratingMap = new Map();

ratings.forEach((item) => {
  ratingMap.set(Number(item.doctor_id), {
    avgRating: Number(item.avg_rating || 0),
    totalFeedbacks: Number(item.total_feedbacks || 0),
    totalRatings: Number(item.total_ratings || 0),
    positiveFeedbacks: Number(item.positive_feedbacks || 0),
    negativeFeedbacks: Number(item.negative_feedbacks || 0)
  });
});

    const data = doctors.map((doctor) => {

      const rating =
        ratingMap.get(Number(doctor.userId))

      return {
        ...doctor,

        avgRating: rating
          ? rating.avgRating.toFixed(1)
          : "0.0",

        totalFeedbacks:
          rating?.totalFeedbacks ?? 0,

        totalRatings:
          rating?.totalRatings ?? 0,

        positiveFeedbacks:
          rating?.positiveFeedbacks ?? 0,

        negativeFeedbacks:
          rating?.negativeFeedbacks ?? 0
      };

    });

    return {
      success: true,
      statusCode: 200,
      message: "Doctors fetched successfully.",
      count: data.length,
      data
    };

  } catch (error) {

    console.error(
      "GET DOCTORS SERVICE ERROR:",
      error
    );

    return {
      success: false,
      statusCode: 500,
      message: "Internal Server Error",
      count: 0,
      data: []
    };

  }
};