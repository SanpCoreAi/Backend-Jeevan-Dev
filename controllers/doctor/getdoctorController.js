const { getDoctorsService } = require("../../services/doctor/getdoctorService");

exports.getDoctors = async (req, res) => {
  try {
    const filters = req.query;

    const result = await getDoctorsService(filters);

    return res.status(result.statusCode).json({
      success: result.success,
      statusCode: result.statusCode,
      message: result.message,
      count: result.count || 0,
      data: result.data || []
    });

  } catch (err) {
    console.error("Controller Error (getDoctors):", err);

    return res.status(500).json({
      success: false,
      statusCode: 500,
      message: "Internal server error while fetching doctors"
    });
  }
};
