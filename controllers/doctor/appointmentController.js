const appointmentService = require("../../services/doctor/appointmentService");
const db = require("../../config/db");
const { bookAppointmentSchema } = require("../../validation/doctor/appointmentValidation");

exports.create = async (req, res) => {

  const { error, value } = bookAppointmentSchema.validate(req.body);

  if (error) {
    return res.status(400).json({
      success: false,
      message: error.details[0].message
    });
  }

  const patientId = req.user.id;
  const doctorId = Number(req.params.doctorId);

  if (!doctorId) {
    return res.status(400).json({
      success: false,
      message: "Invalid doctorId"
    });
  }

  const [userRows] = await db.query(
    "SELECT email FROM users WHERE id = ?",
    [patientId]
  );

  const patientEmail = userRows[0]?.email;

  const payload = { ...value };

  if (payload.time_slot && typeof payload.time_slot === "string") {

    const parts = payload.time_slot.split("-").map(p => p.trim());

    if (parts.length === 2) {
      payload.start_time = parts[0];
      payload.end_time = parts[1];
    }
  }

  if (payload.appointment_for && !payload.booking_type) {
    payload.booking_type = payload.appointment_for;
  }

  if (
    payload.booking_type === "someone_else" &&
    payload.patient &&
    typeof payload.patient === "object"
  ) {

    payload.name = payload.patient.name;
    payload.age = payload.patient.age;
    payload.gender = payload.patient.gender;
    payload.phone = payload.patient.phone;
    payload.email = payload.patient.email;
  }

  const result = await appointmentService.bookAppointment(
    patientId,
    patientEmail,
    doctorId,
    payload
  );

  if (!result.success) {
    return res.status(400).json(result);
  }

  res.status(201).json({
    success: true,
    appointment_id: result.data.appointmentId,
    appointment_token: result.data.appointmentToken
  });
};



exports.getAppointmentById = async (req, res) => {

  const result = await appointmentService.getAppointmentById(req.user.id);

  if (!result.success) {
    return res.status(404).json(result);
  }

  res.status(200).json(result);
};



exports.getDoctorAppointmentsForTable = async (req, res) => {
  try {
    const doctorId = req.user?.id;   // ✅ yaha se aayega

    if (!doctorId) {
      return res.status(400).json({
        success: false,
        message: "Doctor ID missing"
      });
    }

    const result = await appointmentService.getDoctorAppointmentsForTable(doctorId);

    res.status(200).json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
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