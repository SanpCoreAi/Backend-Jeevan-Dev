const AppointmentService = require("../../services/doctor/qrAppointmentService");

exports.scanBook = async (req, res) => {
  try {
    const doctorId = Number(req.params.doctorId);
    let hospital_name = req.body.hospital_name ?? req.body.hospitalName;

    if (typeof hospital_name === "string") {
      hospital_name = hospital_name.trim();
    }

    const date = new Date().toISOString().split("T")[0];

    if (!hospital_name) {
      return res.status(400).json({
        success: false,
        message: "hospital_name is required"
      });
    }

    const data = await AppointmentService.scanBook({
      user: req.user,
      doctorId,
      hospitalName: hospital_name,
      date   
    });

    return res.status(201).json({
      success: true,
      message: "Appointment booked successfully",
      data
    });

  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
};