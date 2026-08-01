const dashboardService = require("../../services/doctor/dashboardService");

const getDoctorId = async (req) => {

  if (req.user.role_id === 2) {
    return {
      success: true,
      doctorId: req.user.id,
    };
  }

  if (req.user.role_id === 3) {

    const user = await dashboardService.getUserById(
      req.user.id
    );

    if (!user || !user.doctor_id) {
      return {
        success: false,
        statusCode: 404,
        message: "Doctor not found.",
      };
    }

    return {
      success: true,
      doctorId: user.doctor_id,
    };

  }

  return {
    success: false,
    statusCode: 403,
    message: "Unauthorized role.",
  };

};

exports.cardNumber = async (req, res) => {
  try {

    const {
      filter,
      startDate,
      endDate,
    } = req.query;

    const result =
      await dashboardService.cardNumber({
        filter,
        startDate,
        endDate,
      });

    return res.status(200).json({
      success: true,
      message: "Dashboard cards fetched successfully.",
      data: result,
    });

  } catch (error) {

    console.error(
      "Dashboard Card Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Internal Server Error.",
    });

  }
};

exports.appointmentGraph = async (req, res) => {
  try {

    const doctor =
      await getDoctorId(req);

    if (!doctor.success) {
      return res.status(
        doctor.statusCode
      ).json({
        success: false,
        message: doctor.message,
      });
    }

    const data =
      await dashboardService.getAppointmentGraph(
        doctor.doctorId
      );

    return res.status(200).json({
      success: true,
      message:
        "Appointment graph fetched successfully.",
      data,
    });

  } catch (error) {

    console.error(
      "Appointment Graph Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Internal Server Error.",
    });

  }
};

exports.todayAppointmentStats = async (
  req,
  res
) => {
  try {

    const doctor =
      await getDoctorId(req);

    if (!doctor.success) {
      return res.status(
        doctor.statusCode
      ).json({
        success: false,
        message: doctor.message,
      });
    }

    const data =
      await dashboardService.getTodayStats(
        doctor.doctorId
      );

    return res.status(200).json({
      success: true,
      message:
        "Today's appointment statistics fetched successfully.",
      data,
    });

  } catch (error) {

    console.error(
      "Today Appointment Stats Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Internal Server Error.",
    });

  }
};