const { searchDoctorService } = require("../../services/doctor/serachDoctorService");

async function searchDoctors(req, res) {
  try {

    const result = await searchDoctorService({ ...req.query, });
    const doctors = result.data || [];

    if (!doctors.length) {
      return res.status(404).json({
        success: false,
        message: "No doctors found for given filters",
        count: 0,
        data: []
      });
    }

    return res.status(200).json({
      success: true,
      message: "Doctors fetched successfully",
      count: doctors.length,
      data: doctors
    });

  } catch (error) {
    console.error("Doctor search error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
}

module.exports = { searchDoctors };
