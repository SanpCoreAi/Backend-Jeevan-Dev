const appointmentService = require("../../services/doctor/appointmentService");
const db = require("../../config/db");
const { bookAppointmentSchema } = require("../../validation/doctor/appointmentValidation");

exports.create = async (req, res) => {
  try {
    const { error, value } = bookAppointmentSchema.validate(req.body);

    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message
      });
    }

    const patientId = req.user.id;
    const doctorId = Number(req.params.doctorId);

    const [userRows] = await db.query(
      "SELECT email FROM users WHERE id = ?",
      [patientId]
    );

    const patientEmail = userRows[0]?.email;

    const result = await appointmentService.bookAppointment(
      patientId,
      patientEmail,
      doctorId,
      value
    );

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.status(201).json({
      success: true,
      appointment_id: result.data.appointmentId,
      appointment_token: result.data.appointmentToken
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

exports.getDoctorAppointmentsForTable = async (req, res) => {

  try {

    const doctorId = req.user.id;

    const {
      hospitalName,
      page = 1,
      limit = 10
    } = req.query;

    if (!hospitalName) {
      return res.status(400).json({
        success: false,
        message: "hospitalName is required"
      });
    }

    const result =
      await appointmentService.getDoctorAppointmentsForTable(
        doctorId,
        hospitalName,
        Number(page),
        Number(limit)
      );

    return res.status(200).json(result);

  } catch (error) {

    console.log(error);

    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};


exports.getAppointmentById = async (req, res) => {
  try {
    const doctorId = req.user.id;
    const appointmentId = Number(req.params.appointmentId); 

    const result = await appointmentService.getAppointmentById(
      doctorId,
      appointmentId
    );

    if (!result.success) {
      return res.status(404).json(result);
    }

    res.status(200).json(result);

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.getTodayAppointments = async (
  req,
  res
) => {

  try {

    // =====================================
    // FULL DEBUG
    // =====================================

    console.log("===== TODAY APPOINTMENTS API =====");

    console.log("req.user =>");
    console.log(req.user);

    console.log("req.query =>");
    console.log(req.query);

    console.log("req.headers.authorization =>");
    console.log(req.headers.authorization);

    // =====================================
    // DOCTOR ID
    // =====================================

    const doctorId =
      req.user?.doctor_id ||
      req.user?.id;

    console.log("doctorId =>", doctorId);

    // =====================================
    // QUERY PARAMS
    // =====================================

    const {
      page = 1,
      limit = 10
    } = req.query;

    console.log("page =>", page);
    console.log("limit =>", limit);

    // =====================================
    // CHECK DOCTOR ID
    // =====================================

    if (!doctorId) {

      console.log("Doctor ID missing");

      return res.status(400).json({
        success: false,
        message: "Doctor ID not found in token"
      });
    }

    // =====================================
    // SERVICE CALL
    // =====================================

    const result =
      await appointmentService.getTodayAppointmentsService(
        doctorId,
        Number(page),
        Number(limit)
      );

    console.log("SERVICE RESULT =>");
    console.log(result);

    // =====================================
    // NO APPOINTMENTS
    // =====================================

    if (
      !result.appointments ||
      result.appointments.length === 0
    ) {

      return res.status(400).json({
        success: false,
        message: "Appointment not found"
      });
    }

    // =====================================
    // SUCCESS RESPONSE
    // =====================================

    return res.status(200).json(result);

  } catch (error) {

    console.log("===== ERROR =====");
    console.log(error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
  }
};



exports.getAppointmentPublicById = async (req, res) => {

  const result = await appointmentService.getAppointmentPublicById(
    req.params.id
  );

  if (!result.success) {
    return res.status(404).json(result);
  }

  res.status(200).json(result);
};



exports.getMyAppointments = async (req, res) => {

  const result = await appointmentService.getMyAppointments(req.user.id);

  res.status(200).json({
    success: true,
    count: result.data.length,
    data: result.data
  });
};