const Appointment = require("../../models/appointment");
const SlotModel = require("../../models/slot");
const Schedule = require("../../models/schedule");
const { parse12to24, time24To12 } = require("../../utils/timeHelper");
const { sendAppointmentEmail } = require("../../utils/sendEmail");

exports.bookAppointment = async (patientId, patientEmail, doctorId, body) => {
  const {
    appointment_date,
    start_time,
    end_time,
    reason_for_visit,
    booking_type,
    mode,
    name,
    age,
    gender,
    phone,
    email
  } = body;



  if (!appointment_date || !start_time || !end_time || !reason_for_visit || !booking_type || !mode) {
    return { success: false, message: "Required fields missing" };
  }

  if (!["online", "offline"].includes(mode)) {
    return { success: false, message: "Mode must be online or offline" };
  }

  const schedules = await Schedule.getScheduleByDoctor(doctorId);

  if (!schedules || schedules.length === 0) {
    return { success: false, message: "No schedule found for doctor" };
  }

  const weekday = new Date(appointment_date).toLocaleDateString("en-US", { weekday: "short" });

  const start24 = parse12to24(start_time);
  const end24 = parse12to24(end_time);

  if (!start24 || !end24) {
    return { success: false, message: "Invalid time format" };
  }

  let schedule = null;
  let slot = null;

  for (const s of schedules) {
    let days = s.active_days;

    // Convert JSON string to array if needed
    if (typeof days === "string") {
      try {
        days = JSON.parse(days);
      } catch (e) {
        days = [];
      }
    }

    // Normalize appointment_date and schedule dates to YYYY-MM-DD
    const apptDateStr = new Date(appointment_date).toISOString().split("T")[0];
    const scheduleStartStr = new Date(s.start_date).toISOString().split("T")[0];
    const scheduleEndStr = new Date(s.end_date).toISOString().split("T")[0];


    // Date range check
    if (apptDateStr < scheduleStartStr || apptDateStr > scheduleEndStr) {
      continue;
    }

    // Weekday check
    if (!days.includes(weekday)) {
      continue;
    }

    // Check for an active slot
    console.log("Looking for slot at:", start24, "on date:", apptDateStr);
    const candidate = await SlotModel.getActiveSlot(s.id, doctorId, apptDateStr, start24);

    if (candidate) {
      schedule = s;
      slot = candidate;
      break;
    }
  }

  if (!schedule) {
    console.log("No matching schedule found");
    return { success: false, message: "Doctor not available on selected date" };
  }

  if (!slot) {
    console.log("No active slot found for schedule");
    return { success: false, message: "Slot not available" };
  }

  const appointmentToken = Math.floor(1000 + Math.random() * 9000);
  const appointmentId = await Appointment.create({
    appointment_token: appointmentToken,
    appointment_date,
    start_time: start24,
    end_time: end24,
    reason_for_visit,
    patient_id: patientId,
    doctor_id: doctorId,
    schedule_id: schedule.id,
    booking_type,
    mode
  });

  if (booking_type === "someone_else") {
    await Appointment.insertOtherPatient({
      appointment_id: appointmentId,
      user_id: patientId,
      name,
      age,
      gender,
      phone,
      email
    });
  }

  await SlotModel.deactivateSlot(slot.id);

  const emailToSend = booking_type === "myself" ? patientEmail : email;
  const timeRange = `${time24To12(start24)} - ${time24To12(end24)}`;

  await sendAppointmentEmail({
    to: emailToSend,
    token: appointmentToken,
    date: appointment_date,
    time: timeRange
  });

  return {
    success: true,
    data: {
      patientId,
      appointmentId,
      appointmentToken
    }
  };
};


exports.getDoctorAppointmentsForTable = async (doctorId, hospitalName, page, limit) => {

  const offset = (page - 1) * limit;

  const { rows } = await Appointment.getDoctorAppointmentsForTable(
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

  const offlineAppointments = rows.filter(item => item.mode === "offline");
  const onlineAppointments = rows.filter(item => item.mode === "online");

  return {
    success: true,
    message: "Appointments fetched successfully",
    offlineAppointments,
    onlineAppointments
  };
};


exports.getAppointmentById = async (patientId) => {

  const appointment = await Appointment.getByIdAndPatient(patientId);

  if (!appointment) {
    return {
      success: false,
      message: "Appointment not found"
    };
  }

  return {
    success: true,
    data: appointment
  };
};



exports.getAppointmentPublicById = async (appointmentId) => {

  const appointment = await Appointment.getAppointmentPublicById(appointmentId);

  if (!appointment) {
    return {
      success: false,
      message: "Appointment not found"
    };
  }

  return {
    success: true,
    data: appointment
  };
};



exports.getMyAppointments = async (patientId) => {

  const appointments = await Appointment.getAllByPatient(patientId);

  return {
    success: true,
    data: appointments
  };
};