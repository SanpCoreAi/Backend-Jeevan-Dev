const { findDoctors } = require("../../models/getdoctorModel");
const FeedbackModel = require("../../models/feedbackModel");

exports.getDoctorsService = async (filters) => {
  const doctors = await findDoctors(filters);

  const ratings = await FeedbackModel.getAllDoctorsRatingSummary();

  const ratingMap = new Map(
    ratings.map((item) => [
      item.doctor_id,
      {
        avgRating: parseFloat(item.avg_rating || 0),
        totalFeedbacks: Number(item.total_feedbacks || 0)
      }
    ])
  );

  const data = doctors.map((doctor) => {
    const rating = ratingMap.get(doctor.doctorId);

    return {
      ...doctor,
      avgRating: (rating?.avgRating ?? 0).toFixed(1),
      totalFeedbacks: rating?.totalFeedbacks || 0
    };
  });

  return {
    success: true,
    statusCode: 200,
    message: data.length
      ? "Doctors fetched successfully"
      : "No doctors found",
    count: data.length,
    data
  };
};