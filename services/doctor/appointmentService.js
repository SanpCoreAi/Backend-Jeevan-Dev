const Appointment = require("../../models/appointment");
const SlotModel = require("../../models/slot");
const Schedule = require("../../models/schedule");
const { parse12to24, time24To12 } = require("../../utils/timeHelper");
const { sendAppointmentEmail } = require("../../utils/sendEmail");

exports.bookAppointment = async (
  patientId,
  patientEmail,
  doctorId,
  body
) => {

  const {
    appointment_date,
    start_time,
    end_time,
    reason_for_visit,
    booking_type,
    mode,
    hospital_name
  } = body;

  if (
    !appointment_date ||
    !start_time ||
    !end_time ||
    !hospital_name
  ) {
    return {
      success: false,
      message: "Required fields missing"
    };
  }

  const schedules =
    await Schedule.getScheduleByDoctor(doctorId);

  if (!schedules.length) {
    return {
      success: false,
      message: "No schedule found"
    };
  }

  const weekday = new Date(appointment_date)
    .toLocaleDateString(
      "en-US",
      { weekday: "short" }
    );

  const start24 = parse12to24(start_time);
  const end24 = parse12to24(end_time);

  let schedule = null;
  let slot = null;

  for (const s of schedules) {

    let days = s.active_days;

    if (typeof days === "string") {
      try {
        days = JSON.parse(days);
      } catch {
        days = [];
      }
    }

    if (
      String(s.hospital_name)
        .toLowerCase()
        .trim() !==
      hospital_name
        .toLowerCase()
        .trim()
    ) {
      continue;
    }

    const apptDate =
      new Date(appointment_date)
        .toISOString()
        .split("T")[0];

    const startDate =
      new Date(s.start_date)
        .toISOString()
        .split("T")[0];

    const endDate =
      new Date(s.end_date)
        .toISOString()
        .split("T")[0];

    if (
      apptDate < startDate ||
      apptDate > endDate
    ) {
      continue;
    }

    if (!days.includes(weekday)) {
      continue;
    }

    const candidate =
      await SlotModel.getActiveSlot(
        s.id,
        doctorId,
        apptDate,
        start24
      );

    if (candidate) {
      schedule = s;
      slot = candidate;
      break;
    }
  }

  if (!schedule) {
    return {
      success: false,
      message:
        "Doctor not available for this hospital/date"
    };
  }

  if (!slot) {
    return {
      success: false,
      message: "Slot not available"
    };
  }

  const token =
    Math.floor(1000 + Math.random() * 9000);

  const appointmentId =
    await Appointment.create({
      appointment_token: token,
      appointment_date,
      start_time: start24,
      end_time: end24,
      patient_id: patientId,
      doctor_id: doctorId,
      schedule_id: schedule.id,
      booking_type,
      mode,
      hospital_name,
      reason_for_visit
    });

  await SlotModel.deactivateSlot(slot.id);

  await sendAppointmentEmail({
    to: patientEmail,
    token,
    date: appointment_date,
    time:
      `${time24To12(start24)} - ${time24To12(end24)}`
  });

  return {
    success: true,
    data: {
      appointmentId,
      appointmentToken: token
    }
  };
};

exports.getDashboardStats = async (doctorId) => {
  return await Appointment.getDashboardStats(doctorId);
};

exports.getDoctorAppointmentsForTable = async (
  doctorId,
  hospitalName,
  page,
  limit
) => {

  const offset = (page - 1) * limit;

  const { rows, total } =
    await Appointment.getDoctorAppointmentsForTable(
      doctorId,
      hospitalName,
      limit,
      offset
    );

  if (!rows || rows.length === 0) {

    return {
      success: false,
      message: `No appointments found for hospital: ${hospitalName}`,
      offlineAppointments: [],
      onlineAppointments: []
    };
  }

  const offlineAppointments = rows.filter(
    (item) => item.mode === "offline"
  );

  const onlineAppointments = rows.filter(
    (item) => item.mode === "online"
  );

  return {
    success: true,
    message: "Appointments fetched successfully",
    total,
    currentPage: page,
    totalPages: Math.ceil(total / limit),
    offlineAppointments,
    onlineAppointments
  };
};

exports.getAppointmentDetails = async (doctorId, appointmentId) => {
  const appointment = await Appointment.getAppointmentDetails(
    doctorId,
    appointmentId
  );

  if (!appointment) {
    return {
      success: false,
      message: "Appointment not found"
    };
  }

  return {
    success: true,
    message: "Appointment details fetched successfully",
    data: appointment
  };
};

exports.getAppointmentById = async (doctorId) => {
  const rows = await Appointment.getAppointmentById(doctorId);

  if (!rows || rows.length === 0) {
    return {
      success: false,
      message: "No appointment found",
      data: null
    };
  }

  return {
    success: true,
    message: "Appointment details fetched successfully",
    data: rows
  };
};


exports.getTodayAppointmentsService =
async (
  doctorId,
  page,
  limit
) => {

  try {

    const offset =
      (page - 1) * limit;

    const {
      rows,
      total
    } =
      await Appointment
        .getAppointments({

          doctorId,

          limit,

          offset
        });

    return {

      success: true,

      message:
        "Appointments fetched successfully",

      total,

      currentPage: page,

      totalPages:
        Math.ceil(
          total / limit
        ),

      appointments:
        rows || []
    };

  } catch (error) {

    throw error;
  }
};

exports.getDashboardCards =
  async ({ doctorId }) => {

    const data =
      await Appointment.getDashboardCards({
        doctorId,
      });

    return data;
  };

  exports.getPatientDashboardCards =
  async ({ doctorId }) => {

    const data =
      await Appointment
        .getPatientDashboardCards({
          doctorId,
        });

    return data;
  };

exports.getAppointmentPublicById = async (patientId) => {
  const appointments = await Appointment.getAppointmentPublicById(patientId);

  if (!appointments || appointments.length === 0) {
    return {
      success: false,
      message: "Appointment not found"
    };
  }

  return {
    success: true,
    count: appointments.length,
    data: appointments
  };
};

exports.getTodayAppointments = async (
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
      return res.status(401).json({
        success: false,
        message: "Unauthorized doctor"
      });
    }

    const result =
      await appointmentService.getTodayAppointmentsService(
        doctorId,
        Number(page),
        Number(limit)
      );

    return res.status(200).json(result);

  } catch (error) {

    console.log(error);

    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.getMyAppointments = async (patientId) => {

  const appointments = await Appointment.getAllByPatient(patientId);

  return {
    success: true,
    data: appointments
  };
};