const { getDoctorsService } = require("../../services/doctor/getdoctorService");

exports.getDoctors = async (req, res) => {
  try {
    const result = await getDoctorsService(req.query);

    return res.status(result.statusCode).json(result);

  } catch (error) {
    console.error("getDoctors:", error);

    return res.status(500).json({
      success: false,
      statusCode: 500,
      message: "Internal server error"
    });
  }
};