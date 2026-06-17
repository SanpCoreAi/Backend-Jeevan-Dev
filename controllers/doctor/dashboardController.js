const dashboardService = require('../../services/doctor/dashboardService');

exports.appointmentGraph = async (req, res) => {
  try {
    const doctorId = req.user.id;

    const data = await dashboardService.getAppointmentGraph(doctorId);

    res.status(200).json({
      success: true,
      data
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server Error'
    });
  }
};
exports.todayAppointmentStats = async (req, res) => {
  try {
    const doctorId = req.user.id;

    const data = await dashboardService.getTodayStats(
      doctorId
    );

    res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};