const DoctorRatingService = require("../../services/doctor/doctorRatingService");

exports.getDoctorProfileWithRating = async (req, res) => {
  try {
    const doctorId = Number(req.params.doctorId);

    if (!Number.isInteger(doctorId) || doctorId <= 0) {
      return res.status(400).json({
        success: false,
        statusCode: 400,
        message: "Valid doctorId is required"
      });
    }

    const result = await DoctorRatingService.getDoctorProfileWithRating(
      doctorId
    );

    return res.status(result.statusCode).json({
      success: result.success,
      statusCode: result.statusCode,
      message: result.message,
      data: result.data || null
    });

  } catch (error) {
    console.error(
      "GET DOCTOR PROFILE WITH RATING CONTROLLER ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      statusCode: 500,
      message: "Internal Server Error"
    });
  }
};