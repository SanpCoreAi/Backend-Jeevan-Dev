const appointmentService = require("../../services/doctor/appointmentService");
const {
  bookAppointmentValidation,
  bookAppointmentByAssistantValidation
} = require("../../validation/doctor/appointmentValidation");

const getDoctorIdFromUser = async (user) => {
  if (user.role === 2) {
    return user.id;
  }

  if (user.role === 3) {
    const assistant = await appointmentService.getUserById(user.id);

    if (!assistant || !assistant.doctor_id) {
      return null;
    }

    return assistant.doctor_id;
  }

  return false;
};

exports.create = async (req, res) => {
  try {

 const { error, value } = bookAppointmentValidation.validate(req.body);

if (error) {
  return res.status(400).json({
    success: false,
    message: error.details[0].message
  });
}

    const patientId = req.user.id;
    const doctorId = Number(req.params.doctorId);

    if (!doctorId || doctorId <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid doctor id"
      });
    }

const patient = await appointmentService.getUserById(patientId);

if (!patient) {
  return res.status(404).json({
    success: false,
    message: "Patient not found"
  });
}

const result = await appointmentService.bookAppointment(
  patientId,
  patient.email,
  doctorId,
  value
);

    return res
      .status(result.success ? 201 : 400)
      .json(result.success
        ? {
            success: true,
            message: "Appointment booked successfully",
            appointment_id: result.data.appointmentId,
            appointment_token: result.data.appointmentToken
          }
        : result);

  } catch (error) {

    console.error("Book Appointment Error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });

  }
};

exports.bookAppointmentByAssistant = async (req, res) => {
  try {

    const { error, value } = bookAppointmentByAssistantValidation.validate(req.body);

    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message
      });
    }

    const result =
      await appointmentService.bookAppointmentByAssistant({
        user: req.user,
        body: value
      });

    return res
      .status(result.success ? 201 : 400)
      .json(result);

  } catch (error) {

    console.error(
      "Book Appointment By Assistant Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });

  }
};

exports.getDoctorAppointmentsForTable = async (req, res) => {
  try {

    const doctorId =
      await getDoctorIdFromUser(req.user);

    if (doctorId === false) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized role"
      });
    }

    if (!doctorId) {
      return res.status(404).json({
        success: false,
        message: "Doctor not found"
      });
    }

    const {
      hospitalName,
      mode,
      slot_date,
      status,
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
        mode,
        slot_date,
        status,
        Number(page),
        Number(limit)
      );

    return res.status(200).json(result);

  } catch (error) {

    console.error(
      "Get Doctor Appointments Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });

  }
};

exports.getDashboardStats = async (req, res) => {
  try {

    const doctorId =
      await getDoctorIdFromUser(req.user);

    if (doctorId === false) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized role"
      });
    }

    if (!doctorId) {
      return res.status(404).json({
        success: false,
        message: "Doctor not found"
      });
    }

    const data =
      await appointmentService.getDashboardStats(
        doctorId
      );

    return res.status(200).json({
      success: true,
      data
    });

  } catch (error) {

    console.error(
      "Dashboard Stats Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });

  }
};

exports.getAppointmentDetails = async (req, res) => {
  try {

    const doctorId =
      await getDoctorIdFromUser(req.user);

    if (doctorId === false) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized role"
      });
    }

    if (!doctorId) {
      return res.status(404).json({
        success: false,
        message: "Doctor not found"
      });
    }

    const appointmentId =
      Number(req.params.appointmentId);

    if (!appointmentId) {
      return res.status(400).json({
        success: false,
        message: "Invalid appointment id"
      });
    }

    const result =
      await appointmentService.getAppointmentDetails(
        doctorId,
        appointmentId
      );

    return res
      .status(result.success ? 200 : 404)
      .json(result);

  } catch (error) {

    console.error(
      "Get Appointment Details Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });

  }
};

exports.getAppointmentById = async (req, res) => {
  try {

    const doctorId =
      await getDoctorIdFromUser(req.user);

    if (doctorId === false) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized role"
      });
    }

    if (!doctorId) {
      return res.status(404).json({
        success: false,
        message: "Doctor not found"
      });
    }

    const result =
      await appointmentService.getAppointmentById(
        doctorId
      );

    return res
      .status(result.success ? 200 : 404)
      .json(result);

  } catch (error) {

    console.error(
      "Get Appointment By Id Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });

  }
};

exports.getTodayAppointments = async (req, res) => {
  try {

    const doctorId =
      await getDoctorIdFromUser(req.user);

    if (doctorId === false) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized role"
      });
    }

    if (!doctorId) {
      return res.status(404).json({
        success: false,
        message: "Doctor not found"
      });
    }

    const {
      page = 1,
      limit = 10
    } = req.query;

    const result =
      await appointmentService.getTodayAppointmentsService(
        doctorId,
        Number(page),
        Number(limit)
      );

    return res.status(200).json(result);

  } catch (error) {

    console.error(
      "Get Today Appointments Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });

  }
};

exports.getAppointmentPublicById = async (req, res) => {
  try {

    const patientId =
      Number(req.params.patient_id);

    if (!patientId) {
      return res.status(400).json({
        success: false,
        message: "Invalid patient id"
      });
    }

    if (req.user) {

      const doctorId =
        await getDoctorIdFromUser(req.user);

      if (doctorId === false) {
        return res.status(403).json({
          success: false,
          message: "Unauthorized role"
        });
      }

      if (!doctorId) {
        return res.status(404).json({
          success: false,
          message: "Doctor not found"
        });
      }

    }

    const result =
      await appointmentService.getAppointmentPublicById(
        patientId
      );

    return res
      .status(result.success ? 200 : 404)
      .json(result);

  } catch (error) {

    console.error(
      "Get Public Appointment Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });

  }
};

exports.getDashboardCards = async (req, res) => {
  try {

    const doctorId =
      await getDoctorIdFromUser(req.user);

    if (doctorId === false) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized role"
      });
    }

    if (!doctorId) {
      return res.status(404).json({
        success: false,
        message: "Doctor not found"
      });
    }

    const data =
      await appointmentService.getDashboardCards({
        doctorId
      });

    return res.status(200).json({
      success: true,
      message:
        "Dashboard cards fetched successfully",
      data
    });

  } catch (error) {

    console.error(
      "Get Dashboard Cards Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });

  }
};

exports.getPatientDashboardCards = async (req, res) => {
  try {

    const doctorId =
      await getDoctorIdFromUser(req.user);

    if (doctorId === false) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized role"
      });
    }

    if (!doctorId) {
      return res.status(404).json({
        success: false,
        message: "Doctor not found"
      });
    }

    const filter =
      req.query.filter || "day";

    const mode =
      req.query.mode;

    const validFilters = [
      "day",
      "week",
      "month",
      "year"
    ];

    if (!validFilters.includes(filter)) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid filter. Allowed values: day, week, month, year"
      });
    }

    const validModes = [
      "online",
      "offline"
    ];

    if (!validModes.includes(mode)) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid mode. Allowed values: online, offline"
      });
    }

    const data =
      await appointmentService.getPatientDashboardCards({
        doctorId,
        filter,
        mode
      });

    return res.status(200).json({
      success: true,
      message:
        "Patient dashboard cards fetched successfully",
      data
    });

  } catch (error) {

    console.error(
      "Get Patient Dashboard Cards Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });

  }
};

exports.getMyAppointments = async (req, res) => {
  try {
    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.min(
      Math.max(Number(req.query.limit) || 10, 1),
      100
    );

    const userRole = Number(req.user.role);

    let userId;

    if (userRole === 1) {
      userId = req.user.id;
    }

    else {
      const doctorId = await getDoctorIdFromUser(req.user);

      if (doctorId === false) {
        return res.status(403).json({
          success: false,
          message: "Unauthorized role."
        });
      }

      if (!doctorId) {
        return res.status(404).json({
          success: false,
          message: "Doctor not found."
        });
      }

      userId = doctorId;
    }

    const filters = {
      year: req.query.year,
      month: req.query.month,
      week: req.query.week,
      date: req.query.date
    };

    const result = await appointmentService.getMyAppointments(
      userId,
      userRole,
      page,
      limit,
      filters
    );

    return res.status(result.statusCode || 200).json({
      success: result.success,
      message: result.message,
      ...result.data
    });

  } catch (error) {
    console.error(
      "Get My Appointments Controller Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Internal server error."
    });
  }
};



exports.getDoctorSlots = async (req, res) => {
  try {

    let {
      doctorId,
      hospitalName,
      date
    } = req.query;

    if (req.user.role === 2) {
      doctorId = req.user.id;
    }

    if (
      !doctorId ||
      !hospitalName ||
      !date
    ) {
      return res.status(400).json({
        success: false,
        message:
          "doctorId, hospitalName and date are required"
      });
    }

    const result =
      await appointmentService.getDoctorSlots({
        doctorId: Number(doctorId),
        hospitalName,
        date
      });

    return res.status(200).json({
      success: true,
      ...result
    });

  } catch (error) {

    console.error(
      "Get Doctor Slots Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });

  }
};

exports.cancelAppointment = async (req, res) => {
  try {

    if (req.user.role !== 1) {
      return res.status(403).json({
        success: false,
        message: "Only patient can cancel appointment"
      });
    }

    const patientId = req.user.id;

    const appointmentId =
      Number(req.params.appointmentId);

    if (!appointmentId) {
      return res.status(400).json({
        success: false,
        message: "Invalid appointment id"
      });
    }

    const { reason } = req.body;

    const result =
      await appointmentService.cancelAppointment(
        patientId,
        appointmentId,
        reason
      );

    return res
      .status(result.success ? 200 : 400)
      .json(result);

  } catch (error) {

    console.error(
      "Cancel Appointment Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });

  }
};