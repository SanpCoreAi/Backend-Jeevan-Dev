const AppointmentService = require("../../services/doctor/qrAppointmentService");

exports.scanBook = async (req, res) => {
  try {

    const doctorId = Number(req.params.doctorId);
    if (!Number.isInteger(doctorId) || doctorId <= 0) {
      return res.status(400).json({
        success: false,
        message: "Valid doctor id is required.",
        data: null
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
        data: null
      });
    }

    const appointmentDate =
      req.body.date ||
      new Date().toLocaleDateString("en-CA", {
        timeZone: "Asia/Kolkata"
      });

    if (!appointmentDate) {
      return res.status(400).json({
        success: false,
        message: "Appointment date is required.",
        data: null
      });
    }

    const startTime =
      req.body.start_time;

    if (
      !startTime ||
      typeof startTime !== "string" ||
      !startTime.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: "Start time is required.",
        data: null
      });
    }

    const tokenNumber =
      Number(
        req.body.token ??
        req.body.token_number
      );

    if (
      !Number.isInteger(tokenNumber) ||
      tokenNumber <= 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Valid token number is required.",
        data: null
      });
    }

    const result =
      await AppointmentService.scanBook({
        user: req.user,
        doctorId,
        hospitalName,
        date: appointmentDate,
        start_time: startTime.trim(),
        tokenNumber
      });

    return res.status(
      result.statusCode || (result.success ? 201 : 400)
    ).json({
      success: result.success,
      message:
        result.body?.message ||
        result.message ||
        "",
      data:
        result.body?.data ||
        result.data ||
        null
    });

  } catch (error) {

    console.error(
      "SCAN BOOK APPOINTMENT CONTROLLER ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Internal Server Error.",
      data: null
    });
  }
};