const DoctorRatingService = require("../../services/doctor/doctorRatingService");

class DoctorRatingController {

  static getDoctorProfileWithRating = async (req, res) => {
    try {
      const { doctorId } = req.params;

      const result = await DoctorRatingService.getDoctorProfileWithRating(doctorId);

      const statusCode = Number(result?.status) || 500;

      if (!result?.success) {
        return res.status(statusCode).json({
          success: false,
          statusCode,
          message: result.message || "Something went wrong"
        });
      }

      return res.status(statusCode).json({
        success: true,
        statusCode,
        data: result.data
      });

    } catch (error) {
      console.error("DoctorRatingController Error:", error);

      return res.status(500).json({
        success: false,
        statusCode: 500,
        message: "Internal server error"
      });
    }
  };

}

module.exports = DoctorRatingController;
