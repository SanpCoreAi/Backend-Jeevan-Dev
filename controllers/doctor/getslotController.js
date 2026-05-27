const { getAvailableSlots } = require("../../services/doctor/getslotService");

async function getAvailableSlotsController(req, res, next) {
  try {
    const { doctor, appointment_date } = req.query;

    if (!doctor || !appointment_date) {
      return res.status(400).json({
        success: false,
        message: "Doctor and appointment_date are required"
      });
    }

    const availableSlots = await getAvailableSlots({ doctor, appointment_date });

    res.status(200).json({
      success: true,
      doctor,
      date: appointment_date,
      available_slots: availableSlots
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

module.exports = { getAvailableSlotsController };