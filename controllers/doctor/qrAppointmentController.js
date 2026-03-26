const AppointmentService = require("../../services/doctor/qrAppointmentService");

exports.scanBook = async (req, res) => {
  try {
    const doctorId = req.params.doctorId;
    const { hospital_name } = req.body; // add this line

    const data = await AppointmentService.scanBook({
      user: req.user,
      doctorId: doctorId,
      hospitalName: hospital_name // pass to service
    });

    return res.status(201).json({
      success: true,
      message: "Appointment booked via QR scan",
      data: data
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
};