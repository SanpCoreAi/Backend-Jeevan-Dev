const appointmentService = require("../../services/doctor/appointmentService");
const db = require("../../config/db");
const { bookAppointmentSchema } = require("../../validation/doctor/appointmentValidation");

exports.create = async (req, res) => {
  try {

    const { error, value } =
      bookAppointmentSchema.validate(req.body);

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

    const result =
      await appointmentService.bookAppointment(
        patientId,
        patientEmail,
        doctorId,
        value
      );

    if (!result.success) {
      return res.status(400).json(result);
    }

    return res.status(201).json({
      success: true,
      appointment_id: result.data.appointmentId,
      appointment_token: result.data.appointmentToken
    });

  } catch (err) {

    console.log(err);

    return res.status(500).json({
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

exports.getTodayAppointments =
async (
  req,
  res
) => {

  try {

    const doctorId =
      req.user?.doctor_id ||
      req.user?.id;

    const {
      page = 1,
      limit = 10
    } = req.query;

    if (!doctorId) {

      return res
        .status(401)
        .json({

          success: false,

          message:
            "Unauthorized doctor"
        });
    }

    const result =
      await appointmentService
        .getTodayAppointmentsService(
          doctorId,
          Number(page),
          Number(limit)
        );

    return res
      .status(200)
      .json(result);

  } catch (error) {

    return res
      .status(500)
      .json({

        success: false,

        message:
          "Internal server error",

        error:
          error.message
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