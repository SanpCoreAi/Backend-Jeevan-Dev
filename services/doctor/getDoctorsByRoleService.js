const { getDoctorsByRole } = require("../../models/getDoctorsByRoleModel");
const AppError = require("../../utils/appError");

exports.getDoctorsByRoleService = async () => {
  try {
    const doctors = await getDoctorsByRole();

    if (!doctors || doctors.length === 0) {
      return {
        success: false,
        statusCode: 404,
        message: "No doctors (users with role_id = 2) found in the database.",
        data: [],
      };
    }

    return {
      success: true,
      statusCode: 200,
      message: "Doctors fetched successfully with user and doctor details.",
      count: doctors.length,
      data: doctors,
    };
  } catch (error) {
    console.error("Service Error (getDoctorsByRoleService):", error);

    if (error instanceof AppError) {
      return {
        success: false,
        statusCode: error.statusCode || 500,
        message: error.message || "Unexpected error occurred.",
      };
    }

    return {
      success: false,
      statusCode: 500,
      message: "Internal server error while fetching doctors.",
      error: error.message,
    };
  }
};
