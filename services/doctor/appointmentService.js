const Appointment = require("../../models/appointment");
const SlotModel = require("../../models/slot");
const Schedule = require("../../models/schedule");
const User = require("../../models/usermodel");
const { parse12to24, time24To12 } = require("../../utils/timeHelper");
const { sendAppointmentEmail } = require("../../utils/sendEmail");
const dayjs = require("dayjs");

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
    hospital_name,
    patient
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

  // Maximum 2 appointments per patient per selected date
  const totalAppointments =
    await Appointment.countTodayAppointments(
      patientId,
      appointment_date
    );

  if (totalAppointments >= 2) {
    return {
      success: false,
      message:
        "You can book maximum 2 appointments for the selected date."
    };
  }

  const schedules =
    await Schedule.getScheduleByDoctor(
      doctorId
    );

  if (!schedules.length) {
    return {
      success: false,
      message: "No schedule found"
    };
  }

  const weekday =
    new Date(appointment_date)
      .toLocaleDateString("en-US", {
        weekday: "short"
      });

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

 const startDate = dayjs(s.start_date).format("YYYY-MM-DD");
    const endDate = dayjs(s.end_date).format("YYYY-MM-DD");
    const apptDate = dayjs(appointment_date).format("YYYY-MM-DD");

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
      message: "Doctor not available for this hospital/date"
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

  if (
    booking_type === "someone_else" &&
    patient
  ) {

    await Appointment.insertOtherPatient({

      appointment_id: appointmentId,

      user_id: patientId,

      name: patient.name,

      age: patient.age,

      gender: patient.gender,

      phone: patient.phone,

      email: patient.email

    });

  }

  await SlotModel.deactivateSlot(slot.id);

  await sendAppointmentEmail({

    to: patientEmail,

    token,

    date: appointment_date,

    time: `${time24To12(start24)} - ${time24To12(end24)}`

  });

  return {

    success: true,

    data: {

      appointmentId,

      appointmentToken: token

    }

  };

};

async function bookAppointmentByAssistant({
  user,
  body
}) {

  const assistant = await User.findById(user.id);

  if (!assistant) {
    return {
      success: false,
      message: "Assistant not found"
    };
  }

  if (!assistant.doctor_id) {
    return {
      success: false,
      message: "Doctor not mapped with assistant"
    };
  }

  const doctorId = assistant.doctor_id;

  const {
    appointment_date,
    hospital_name,
    mode,
    booking_type,
    reason_for_visit,
    patient
  } = body;

  const token =
    await Appointment.getNextTokenNumber(
      doctorId,
      appointment_date,
      hospital_name
    );

  const appointmentId =
    await Appointment.create({

      appointment_token: token,

      appointment_date,

      start_time: null,

      end_time: null,

      patient_id: null,

      doctor_id: doctorId,

      schedule_id: null,

      booking_type,

      mode,

      hospital_name,

      reason_for_visit

    });

  await Appointment.insertOtherPatient({

    appointment_id: appointmentId,

    user_id: user.id,

    name: patient.name,

    age: patient.age,

    gender: patient.gender,

    phone: patient.phone,

    email: patient.email

  });

  return {

    success: true,

    message: "Appointment booked successfully",

    data: {

      appointment_id: appointmentId,

      doctor_id: doctorId,

      token_number: token,

      appointment_date,

      hospital_name

    }

  };

}

exports.bookAppointmentByAssistant = bookAppointmentByAssistant;

exports.getDashboardStats = async (doctorId) => {
  return await Appointment.getDashboardStats(doctorId);
};

exports.getAppointmentPublicById = async (patientId) => {

  const appointments =
    await Appointment.getAppointmentPublicById(patientId);


  if (!appointments || appointments.length === 0) {

    return {
      success:false,
      message:"Appointment not found"
    };

  }


  return {
    success:true,
    count:appointments.length,
    data:appointments
  };

};

exports.getDoctorAppointmentsForTable = async (
  doctorId,
  hospitalName,
  mode,
  booked_at,
  status,
  page,
  limit
) => {

  const offset = (page - 1) * limit;

  const { rows, total } =
    await Appointment.getDoctorAppointmentsForTable(
      doctorId,
      hospitalName,
      mode,
      booked_at,
      status,
      limit,
      offset
    );

  if (!rows || rows.length === 0) {
    return {
      success: false,
      message: "No appointments found",
      appointments: []
    };
  }

  return {
    success: true,
    message: "Appointments fetched successfully",
    total,
    currentPage: page,
    totalPages: Math.ceil(total / limit),
    appointments: rows
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

  const rows = await Appointment.getAppointmentById(
    doctorId
  );


  if (!rows || rows.length === 0) {

    return {
      success:false,
      message:"No appointment found",
      data:null
    };

  }


  return {

    success:true,
    message:"Appointment details fetched successfully",
    data:rows

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
      doctorId
    });


  return data;

};

exports.getPatientDashboardCards =
async ({ doctorId }) => {


  const data =
    await Appointment
      .getPatientDashboardCards({
        doctorId
      });


  return data;

};



exports.getUserById = async(id)=>{

  const user =
    await User.findById(id);

  return user;

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

exports.getMyAppointments = async (userId) => {

  const appointments =
    await Appointment.getAllByPatient(
      userId
    );


  return {

    success:true,

    data:appointments

  };

};


exports.getDoctorSlots = async ({
  doctorId,
  hospitalName,
  date,
}) => {

  const slots = await SlotModel.getDoctorSlots(
    doctorId,
    hospitalName,
    date
  );

  return {
    doctorId,
    hospitalName,
    date,
    slots: slots.map(slot => ({
      slotId: slot.id,
      start: slot.start_time,
      end: slot.end_time,
      status: slot.status
    }))
  };
};

exports.cancelAppointment = async (
  patientId,
  appointmentId,
  reason
) => {

  if (!reason || !reason.trim()) {
    return {
      success: false,
      message: "Cancellation reason is required"
    };
  }

  const appointment =
    await Appointment.getAppointmentForCancel(
      appointmentId,
      patientId
    );

  if (!appointment) {
    return {
      success: false,
      message: "Appointment not found"
    };
  }

  if (appointment.status.toLowerCase() === "cancelled") {
    return {
      success: false,
      message: "Appointment already cancelled"
    };
  }

  await Appointment.cancelAppointment(
    appointmentId,
    reason.trim()
  );

  await SlotModel.getActiveSlot(
    appointment.schedule_id,
    appointment.doctor_id,
    appointment.slot_date,
    appointment.start_time
  );

  return {
    success: true,
    message: "Appointment cancelled successfully"
  };

};