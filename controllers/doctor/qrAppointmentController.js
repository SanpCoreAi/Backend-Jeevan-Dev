const AppointmentService = require("../../services/doctor/qrAppointmentService");

exports.scanBook = async (req, res) => {
  try {
    const doctorId = Number(req.params.doctorId);

    if (!Number.isInteger(doctorId) || doctorId <= 0) {
      return res.status(400).json({
        success: false,
        message: "Valid doctor id is required.",
        data: null,
      });
    }

    let hospitalName =
      req.body.hospital_name ||
      req.body.hospitalName;

    if (typeof hospitalName === "string") {
      hospitalName = hospitalName.trim();
    }

    if (!hospitalName) {
      return res.status(400).json({
        success: false,
        message: "Hospital name is required.",
        data: null,
      });
    }

    const appointmentDate = new Date()
      .toLocaleDateString("en-CA", {
        timeZone: "Asia/Kolkata",
      });

    const result =
      await AppointmentService.scanBook({
        user: req.user,
        doctorId,
        hospitalName,
        date: appointmentDate,
      });

    return res.status(result.statusCode).json({
      success: result.success,
      message: result.body.message,
      data: result.body.data || null,
    });

  } catch (error) {

    console.error(
      "SCAN BOOK APPOINTMENT CONTROLLER ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Internal Server Error.",
      data: null,
    });

  }
};