const { findDoctors } = require("../../models/getdoctorModel");

exports.getDoctorsService = async (filters) => {
  try {
    const doctors = await findDoctors(filters);

    if (!doctors || doctors.length === 0) {
      return {
        success: false,
        statusCode: 404,
        message: "No doctors found",
        data: []
      };
    }

    return {
      success: true,
      statusCode: 200,
      message: "Doctors fetched successfully",
      count: doctors.length,
      data: doctors
    };

  } catch (error) {
    console.error("Service Error (getDoctorsService):", error);

    return {
      success: false,
      statusCode: 500,
      message: "Internal server error while fetching doctors"
    };
  }
};
