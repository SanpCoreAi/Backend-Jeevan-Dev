const { findDoctors } = require("../../models/getdoctorModel");

exports.getDoctorsService = async (filters) => {
  const doctors = await findDoctors(filters);

  return {
    success: true,
    statusCode: 200,
    message: doctors.length
      ? "Doctors fetched successfully"
      : "No doctors found",
    count: doctors.length,
    data: doctors
  };
};