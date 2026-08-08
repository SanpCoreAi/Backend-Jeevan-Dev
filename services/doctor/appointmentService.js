const db = require("../../config/db");
const Appointment = require("../../models/appointment");
const SlotModel = require("../../models/slot");
const Schedule = require("../../models/schedule");
const User = require("../../models/usermodel");
const { parse12to24, time24To12 } = require("../../utils/timeHelper");
const { sendAppointmentEmail } = require("../../utils/sendEmail");
const notificationService = require("../notification/notificationService");
const dayjs = require("dayjs");

exports.bookAppointment = async (
  patientId,
  patientEmail,
  doctorId,
  body
) => {

  const connection = await Appointment.getConnection();

  try {

    await connection.beginTransaction();

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

      await connection.rollback();

      return {
        success: false,
        message: "Required fields missing"
      };

    }

    const totalAppointments =
      await Appointment.countTodayAppointments(
        patientId,
        appointment_date,
        connection
      );

    if (totalAppointments >= 2) {

      await connection.rollback();

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

      await connection.rollback();

      return {
        success: false,
        message: "No schedule found"
      };

    }

    const weekday =
      dayjs(appointment_date)
        .format("ddd");

    const start24 =
      parse12to24(start_time);

    const end24 =
      parse12to24(end_time);

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
          .trim()
          .toLowerCase() !==
        hospital_name
          .trim()
          .toLowerCase()
      ) {
        continue;
      }

      const startDate =
        dayjs(s.start_date)
          .format("YYYY-MM-DD");

      const endDate =
        dayjs(s.end_date)
          .format("YYYY-MM-DD");

      const apptDate =
        dayjs(appointment_date)
          .format("YYYY-MM-DD");

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
          start24,
          connection
        );

      if (candidate) {

        schedule = s;
        slot = candidate;
        break;

      }

    }

    if (!schedule) {

      await connection.rollback();

      return {
        success: false,
        message:
          "Doctor not available for this hospital/date"
      };

    }

    if (!slot) {

      await connection.rollback();

      return {
        success: false,
        message: "Slot not available"
      };

    }

    const alreadyBooked =
      await Appointment.checkSlotBooked(
        doctorId,
        appointment_date,
        start24,
        connection
      );

    if (alreadyBooked) {

      await connection.rollback();

      return {
        success: false,
        message:
          "This slot has already been booked."
      };

    }


    let token;

    if (mode === "online") {

      do {
        token = Math.floor(1000 + Math.random() * 9000);
      } while (
        await Appointment.checkTokenExists(
          doctorId,
          appointment_date,
          hospital_name,
          token,
          connection
        )
      );

    } else {

      token = await Appointment.getNextTokenNumber(
        doctorId,
        appointment_date,
        hospital_name,
        connection
      );

    }

    const appointmentId =
      await Appointment.create(
        {
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
        },
        connection
      );

    if (
      booking_type === "someone_else" &&
      patient
    ) {

      await Appointment.insertOtherPatient(
        {
          appointment_id: appointmentId,

          user_id: patientId,

          name: patient.name,

          age: patient.age,

          gender: patient.gender,

          phone: patient.phone,

          email: patient.email
        },
        connection
      );

    }

    await SlotModel.deactivateSlot(
      slot.id,
      connection
    );

    await notificationService.createNotification({

      userId: patientId,

      title: "Appointment Booked",

      message:
        `Your appointment has been booked successfully. Token No: ${token}`,

      type: "SUCCESS",

      createdBy: doctorId

    });

    await connection.commit();

    connection.release();

    try {

      await sendAppointmentEmail({

        to: patientEmail,

        token,

        date: appointment_date,

        time:
          `${time24To12(start24)} - ${time24To12(end24)}`

      });

    } catch (emailError) {

      console.error(
        "Appointment Email Error:",
        emailError
      );

    }

    return {

      success: true,

      message:
        "Appointment booked successfully",

      data: {

        appointmentId,

        appointmentToken: token

      }

    };

  } catch (error) {

    await connection.rollback();

    connection.release();

    console.error(
      "Book Appointment Error:",
      error
    );

    return {

      success: false,

      message:
        "Internal Server Error"

    };

  }

};

async function bookAppointmentByAssistant({
  user,
  body
}) {

  const assistant =
    await User.findById(user.id);

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

  if (!patient || typeof patient !== "object" || !patient.name) {
    return {
      success: false,
      message: "Patient details are required"
    };
  }

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

  await notificationService.createNotification({

    userId: user.id,

    title: "Appointment Booked",

    message: `Appointment booked successfully. Token No: ${token}`,

    type: "SUCCESS",

    createdBy: doctorId

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

exports.bookAppointmentByAssistant =
  bookAppointmentByAssistant;

exports.getDashboardStats =
  async (doctorId) => {

    return await Appointment.getDashboardStats(
      doctorId
    );

  };

exports.getAppointmentPublicById =
  async (patientId) => {

    const appointments =
      await Appointment.getAppointmentPublicById(
        patientId
      );

    if (!appointments.length) {

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

exports.getDoctorAppointmentsForTable =
  async (

    doctorId,

    hospitalName,

    mode,

    slot_date,

    status,

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
        await Appointment.getDoctorAppointmentsForTable(

          doctorId,

          hospitalName,

          mode,

          slot_date,

          status,

          limit,

          offset

        );

      return {

        success: true,

        message:
          "Appointments fetched successfully.",

        total,

        currentPage: page,

        totalPages:
          Math.ceil(total / limit),

        appointments: rows

      };

    } catch (error) {

      console.error(
        "Get Doctor Appointments Service Error:",
        error
      );

      return {

        success: false,

        message:
          "Internal Server Error",

        appointments: []

      };

    }

  };

exports.getAppointmentDetails = async (
  doctorId,
  appointmentId
) => {

  try {

    const appointment =
      await Appointment.getAppointmentDetails(
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

      message:
        "Appointment details fetched successfully",

      data: appointment

    };

  } catch (error) {

    console.error(
      "Get Appointment Details Error:",
      error
    );

    return {

      success: false,

      message:
        "Internal Server Error"

    };

  }

};

exports.getAppointmentById = async (
  doctorId
) => {

  try {

    const rows =
      await Appointment.getAppointmentById(
        doctorId
      );

    if (!rows.length) {

      return {

        success: false,

        message:
          "No appointment found",

        data: []

      };

    }

    return {

      success: true,

      message:
        "Appointment details fetched successfully",

      data: rows

    };

  } catch (error) {

    console.error(
      "Get Appointment By Id Error:",
      error
    );

    return {

      success: false,

      message:
        "Internal Server Error"

    };

  }

};

exports.getTodayAppointmentsService =
  async (
    doctorId,
    page = 1,
    limit = 10
  ) => {

    try {

      const offset =
        (page - 1) * limit;

      const {
        rows,
        total
      } =
        await Appointment.getAppointments({

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
          Math.ceil(total / limit),

        appointments:
          rows || []

      };

    } catch (error) {

      console.error(
        "Get Today Appointments Error:",
        error
      );

      return {

        success: false,

        message:
          "Internal Server Error",

        appointments: []

      };

    }

  };

exports.getDashboardCards =
  async ({ doctorId }) => {

    try {

      return await Appointment.getDashboardCards({

        doctorId

      });

    } catch (error) {

      console.error(
        "Dashboard Cards Error:",
        error
      );

      throw error;

    }

  };

exports.getPatientDashboardCards =
  async ({
    doctorId,
    filter,
    mode
  }) => {

    try {

      return await Appointment.getPatientDashboardCards({

        doctorId,

        filter,

        mode

      });

    } catch (error) {

      console.error(
        "Patient Dashboard Cards Error:",
        error
      );

      throw error;

    }

  };

exports.getUserById = async (
  id
) => {

  return await User.findById(id);

};

const validateYear = (year) => {
  if (
    year === undefined ||
    year === null ||
    year === ""
  ) {
    throw {
      statusCode: 400,
      message: "Year is required."
    };
  }

  const value = Number(year);

  if (!Number.isInteger(value)) {
    throw {
      statusCode: 400,
      message: "Year must be a valid integer."
    };
  }

  if (value < 2000 || value > 2100) {
    throw {
      statusCode: 400,
      message: "Year must be between 2000 and 2100."
    };
  }

  return value;
};

const validateMonth = (month) => {
  if (
    month === undefined ||
    month === null ||
    month === ""
  ) {
    throw {
      statusCode: 400,
      message: "Month is required."
    };
  }

  const value = Number(month);

  if (!Number.isInteger(value)) {
    throw {
      statusCode: 400,
      message: "Month must be a valid integer."
    };
  }

  if (value < 1 || value > 12) {
    throw {
      statusCode: 400,
      message: "Month must be between 1 and 12."
    };
  }

  return value;
};

const validateWeek = (week) => {
  if (
    week === undefined ||
    week === null ||
    week === ""
  ) {
    throw {
      statusCode: 400,
      message: "Week date is required."
    };
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(week)) {
    throw {
      statusCode: 400,
      message: "Week must be in YYYY-MM-DD format."
    };
  }

  const date = new Date(`${week}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    throw {
      statusCode: 400,
      message: "Invalid week date."
    };
  }

  return week;
};

const validateDate = (date) => {
  if (
    date === undefined ||
    date === null ||
    date === ""
  ) {
    throw {
      statusCode: 400,
      message: "Date is required."
    };
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    throw {
      statusCode: 400,
      message: "Date must be in YYYY-MM-DD format."
    };
  }

  const parsedDate = new Date(`${date}T00:00:00`);

  if (Number.isNaN(parsedDate.getTime())) {
    throw {
      statusCode: 400,
      message: "Invalid date."
    };
  }

  const [year, month, day] = date.split("-").map(Number);

  if (
    parsedDate.getFullYear() !== year ||
    parsedDate.getMonth() + 1 !== month ||
    parsedDate.getDate() !== day
  ) {
    throw {
      statusCode: 400,
      message: "Invalid date."
    };
  }

  return date;
};


exports.getMyAppointments = async (
  userId,
  role,
  page,
  limit,
  filters
) => {
  try {
    const {
      year,
      month,
      week,
      date
    } = filters;

    const filterCount = [
      year,
      month,
      week,
      date
    ].filter(value => value !== undefined && value !== "")
      .length;

    if (filterCount === 0) {
      const offset = (page - 1) * limit;

      let appointments;
      let total;

      if (role === 1) {
        appointments = await Appointment.getAllByPatient(
          userId,
          limit,
          offset
        );

        total = await Appointment.getPatientAppointmentCount(
          userId
        );
      } else {
        appointments = await Appointment.getAllByDoctor(
          userId,
          limit,
          offset
        );

        total = await Appointment.getDoctorAppointmentCount(
          userId
        );
      }

      return {
        success: true,
        statusCode: 200,
        message: "Appointments fetched successfully.",
        data: {
          filter: "all",
          page,
          limit,
          totalRecords: Number(total),
          totalPages: Math.ceil(total / limit),
          count: appointments.length,
          data: appointments
        }
      };
    }

    if (year && !month && !week && !date) {

      const validYear = validateYear(year);

      const data =
        role === 1
          ? await Appointment.getYearlyAppointmentStatsForPatient(
            userId,
            validYear
          )
          : await Appointment.getYearlyAppointmentStatsForDoctor(
            userId,
            validYear
          );

      return {
        success: true,
        statusCode: 200,
        message: "Yearly appointment statistics fetched successfully.",
        data: {
          filter: "year",
          year: validYear,
          totalAppointments: data.reduce(
            (sum, item) => sum + item.appointmentCount,
            0
          ),
          data
        }
      };
    }

    if (year && month && !week && !date) {

      const validYear = validateYear(year);
      const validMonth = validateMonth(month);

      const data =
        role === 1
          ? await Appointment.getMonthlyAppointmentStatsForPatient(
            userId,
            validYear,
            validMonth
          )
          : await Appointment.getMonthlyAppointmentStatsForDoctor(
            userId,
            validYear,
            validMonth
          );

      return {
        success: true,
        statusCode: 200,
        message: "Monthly appointment statistics fetched successfully.",
        data: {
          filter: "month",
          year: validYear,
          month: validMonth,
          totalAppointments: data.reduce(
            (sum, item) => sum + item.appointmentCount,
            0
          ),
          data
        }
      };
    }

    if (week && !year && !month && !date) {

      const validWeek = validateWeek(week);

      const data =
        role === 1
          ? await Appointment.getWeeklyAppointmentStatsForPatient(
            userId,
            validWeek
          )
          : await Appointment.getWeeklyAppointmentStatsForDoctor(
            userId,
            validWeek
          );

      return {
        success: true,
        statusCode: 200,
        message: "Weekly appointment statistics fetched successfully.",
        data: {
          filter: "week",
          week: validWeek,
          totalAppointments: data.reduce(
            (sum, item) => sum + item.appointmentCount,
            0
          ),
          data
        }
      };
    }

    if (date && !year && !month && !week) {

      const validDate = validateDate(date);

      const appointments =
        role === 1
          ? await Appointment.getAppointmentsByDateForPatient(
            userId,
            validDate
          )
          : await Appointment.getAppointmentsByDateForDoctor(
            userId,
            validDate
          );

      return {
        success: true,
        statusCode: 200,
        message: "Appointments fetched successfully.",
        data: {
          filter: "date",
          date: validDate,
          count: appointments.length,
          data: appointments
        }
      };
    }

    return {
      success: false,
      statusCode: 400,
      message:
        "Invalid filter combination. Use year, year+month, week, or date."
    };

  } catch (error) {
    console.error(
      "Get My Appointments Service Error:",
      error
    );

    throw error;
  }
};

exports.getDoctorSlots = async ({
  doctorId,
  hospitalName,
  date
}) => {

  const slots =
    await SlotModel.getDoctorSlots(
      doctorId,
      hospitalName,
      date
    );

  return {
    success: true,
    doctorId,
    hospitalName,
    date,
    totalSlots: slots.length,

    booking_length:
      slots.length > 0
        ? Number(slots[0].booking_length)
        : 0,

    slots: slots.map((slot) => ({
      slotId: slot.id,
      startTime: slot.start_time,
      endTime: slot.end_time,
      status: slot.status
    }))
  };

};


exports.cancelAppointment = async (
  patientId,
  appointmentId,
  reason
) => {

  const connection =
    await Appointment.getConnection();

  try {

    await connection.beginTransaction();

    if (!reason || !reason.trim()) {

      await connection.rollback();

      return {
        success: false,
        message: "Cancellation reason is required"
      };

    }

    const appointment =
      await Appointment.cancelAppointment(
        appointmentId,
        patientId,
        connection
      );

    if (!appointment) {

      await connection.rollback();

      return {
        success: false,
        message: "Appointment not found"
      };

    }

    if (
      appointment.status &&
      appointment.status.toUpperCase() === "CANCELLED"
    ) {

      await connection.rollback();

      return {
        success: false,
        message: "Appointment already cancelled"
      };

    }

    await Appointment.cancelAppointment(
      appointmentId,
      reason.trim(),
      connection
    );

    // Slot ko dobara available karo
    if (appointment.schedule_id) {

      await SlotModel.activateSlot(
        appointment.schedule_id,
        appointment.doctor_id,
        appointment.slot_date,
        appointment.start_time,
        connection
      );

    }

    await connection.commit();
    try {

      await notificationService.createNotification({

        userId: patientId,

        title: "Appointment Cancelled",

        message:
          `Your appointment on ${appointment.slot_date} has been cancelled successfully.`,

        type: "WARNING",

        createdBy: patientId

      });

    } catch (error) {

      console.error(
        "Notification Error:",
        error.message
      );

    }

    return {

      success: true,

      message: "Appointment cancelled successfully"

    };

  } catch (error) {

    await connection.rollback();

    console.error(
      "Cancel Appointment Error:",
      error
    );

    throw error;

  } finally {

    connection.release();

  }

};