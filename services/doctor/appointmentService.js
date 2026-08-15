const db = require("../../config/db");
const Appointment = require("../../models/appointment");
const SlotModel = require("../../models/slot");
const Schedule = require("../../models/schedule");
const User = require("../../models/usermodel");
const { parse12to24, time24To12 } = require("../../utils/timeHelper");
const { sendAppointmentEmail, sendAppointmentEmails } = require("../../utils/sendEmail");
const notificationService = require("../notification/notificationService");
const dayjs = require("dayjs");

const getEstimatedTime = (startTime) => {
  if (!startTime) return null;

  const match = String(startTime)
    .trim()
    .match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);

  if (!match) {
    return null;
  }

  let hour = Number(match[1]);
  const minute = Number(match[2]);
  const period = match[3].toUpperCase();

  if (period === "AM" && hour === 12) {
    hour = 0;
  }

  if (period === "PM" && hour !== 12) {
    hour += 12;
  }

  let totalMinutes = hour * 60 + minute + 30;

  totalMinutes = totalMinutes % (24 * 60);

  let estimatedHour = Math.floor(totalMinutes / 60);
  const estimatedMinute = totalMinutes % 60;

  const estimatedPeriod =
    estimatedHour >= 12 ? "PM" : "AM";

  estimatedHour = estimatedHour % 12;

  if (estimatedHour === 0) {
    estimatedHour = 12;
  }

  return `${String(estimatedHour).padStart(2, "0")}:${String(
    estimatedMinute
  ).padStart(2, "0")} ${estimatedPeriod}`;
};

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
        statusCode: 400,
        message: "Required fields missing"
      };
    }

    const apptDate =
      dayjs(appointment_date).format("YYYY-MM-DD");

    const emailDate =
      dayjs(appointment_date).format("DD MMM YYYY");

    const totalAppointments =
      await Appointment.countTodayAppointments(
        patientId,
        apptDate,
        connection
      );

    if (totalAppointments >= 2) {
      await connection.rollback();

      return {
        success: false,
        statusCode: 400,
        message:
          "You can book maximum 2 appointments for the selected date."
      };
    }

    const schedules =
      await Schedule.getScheduleByDoctor(doctorId);

    if (!schedules || schedules.length === 0) {
      await connection.rollback();

      return {
        success: false,
        statusCode: 404,
        message: "No schedule found"
      };
    }

    const weekday =
      dayjs(apptDate).format("ddd");

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
        } catch (error) {
          days = [];
        }
      }

      if (!Array.isArray(days)) {
        days = [];
      }

      if (
        String(s.hospital_name)
          .trim()
          .toLowerCase() !==
        String(hospital_name)
          .trim()
          .toLowerCase()
      ) {
        continue;
      }

      const startDate =
        dayjs(s.start_date).format("YYYY-MM-DD");

      const endDate =
        dayjs(s.end_date).format("YYYY-MM-DD");

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
      await connection.rollback();

      return {
        success: false,
        statusCode: 400,
        message:
          "Doctor not available for this hospital/date"
      };
    }

    if (!slot) {
      await connection.rollback();

      return {
        success: false,
        statusCode: 400,
        message: "Slot not available"
      };
    }

    const alreadyBooked =
      await Appointment.checkSlotBooked(
        doctorId,
        apptDate,
        start24,
        connection
      );

    if (alreadyBooked) {
      await connection.rollback();

      return {
        success: false,
        statusCode: 409,
        message:
          "This slot has already been booked."
      };
    }

    let code;

    do {
      code = Math.floor(
        1000 + Math.random() * 9000
      );

    } while (
      await Appointment.checkCodeExists(
        doctorId,
        apptDate,
        code,
        connection
      )
    );

    const tokenNumber =
      slot.token_number;

    if (
      tokenNumber === null ||
      tokenNumber === undefined
    ) {
      await connection.rollback();

      return {
        success: false,
        statusCode: 400,
        message:
          "Token number is not available for this slot."
      };
    }

    const appointmentId =
      await Appointment.create(
        {
          token_number: tokenNumber,

          code,

          appointment_date: apptDate,

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
        `Your appointment has been booked successfully. ` +
        `Token No: ${tokenNumber}. ` +
        `Booking Code: ${code}`,

      type: "SUCCESS",

      createdBy: doctorId
    });

    await connection.commit();

    connection.release();

    try {
      const estimatedTime = getEstimatedTime(start_time);

      await sendAppointmentEmail({
        to: patientEmail,

        code,

        tokenNumber,

        date: emailDate,

        estimatedTime,

        hospitalName: hospital_name
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

        code,

        tokenNumber
      }
    };

  } catch (error) {

    try {
      await connection.rollback();
    } catch (rollbackError) {
      console.error(
        "Rollback Error:",
        rollbackError
      );
    }

    try {
      connection.release();
    } catch (releaseError) {
      console.error(
        "Connection Release Error:",
        releaseError
      );
    }

    console.error(
      "Book Appointment Service Error:",
      error
    );

    return {
      success: false,
      statusCode: 500,
      message: "Internal server error"
    };
  }
};

exports.bookAppointmentByAssistant = async ({
  user,
  body
}) => {

  let connection = null;

  try {

    if (!user || !user.id) {
      return {
        success: false,
        statusCode: 401,
        message: "Unauthorized user.",
        data: null
      };
    }


    const assistant = await User.findById(user.id);

    if (!assistant) {
      return {
        success: false,
        statusCode: 404,
        message: "Assistant not found.",
        data: null
      };
    }


    if (!assistant.doctor_id) {
      return {
        success: false,
        statusCode: 400,
        message: "Doctor not mapped with assistant.",
        data: null
      };
    }


    const doctorId = Number(assistant.doctor_id);

    const {
      appointment_date,
      hospital_name,
      mode,
      booking_type,
      start_time,
      reason_for_visit,
      patient
    } = body;

    if (!appointment_date) {
      return {
        success: false,
        statusCode: 400,
        message: "Appointment date is required.",
        data: null
      };
    }


    if (!hospital_name) {
      return {
        success: false,
        statusCode: 400,
        message: "Hospital name is required.",
        data: null
      };
    }


    if (!start_time) {
      return {
        success: false,
        statusCode: 400,
        message: "Appointment start time is required.",
        data: null
      };
    }


    if (booking_type !== "someone_else") {
      return {
        success: false,
        statusCode: 400,
        message: 'booking_type must be "someone_else".',
        data: null
      };
    }


    if (
      !patient ||
      typeof patient !== "object" ||
      !patient.name
    ) {
      return {
        success: false,
        statusCode: 400,
        message: "Patient details are required.",
        data: null
      };
    }

    const appointmentDate =
      dayjs(appointment_date).format("YYYY-MM-DD");

    connection = await db.getConnection();

    await connection.beginTransaction();

    const [scheduleRows] =
      await connection.execute(
        `
        SELECT
          id,
          doctor_id,
          hospital_name,
          start_date,
          end_date,
          active_days,
          start_time,
          end_time,
          slot_duration,
          status
        FROM schedules
        WHERE doctor_id = ?
          AND LOWER(TRIM(hospital_name))
              = LOWER(TRIM(?))
          AND LOWER(status) = 'active'
          AND DATE(start_date) <= ?
          AND DATE(end_date) >= ?
        ORDER BY id DESC
        LIMIT 1
        FOR UPDATE
        `,
        [
          doctorId,
          hospital_name,
          appointmentDate,
          appointmentDate
        ]
      );


    if (!scheduleRows.length) {

      await connection.rollback();

      return {
        success: false,
        statusCode: 404,
        message:
          "Doctor schedule not found for this hospital/date.",
        data: null
      };
    }


    const schedule = scheduleRows[0];


    let activeDays = schedule.active_days;

    if (typeof activeDays === "string") {

      try {
        activeDays = JSON.parse(activeDays);
      } catch (error) {
        activeDays = [];
      }
    }


    if (!Array.isArray(activeDays)) {
      activeDays = [];
    }


    const appointmentDay =
      dayjs(appointmentDate).format("ddd");


    if (!activeDays.includes(appointmentDay)) {

      await connection.rollback();

      return {
        success: false,
        statusCode: 400,
        message:
          `Doctor is not available on ${appointmentDay}.`,
        data: null
      };
    }

    const convertTo24Hour = (value) => {

      if (!value) return null;

      value = String(value)
        .trim()
        .toUpperCase();

      // Already HH:mm or HH:mm:ss
      if (/^\d{2}:\d{2}(:\d{2})?$/.test(value)) {

        if (value.length === 5) {
          return `${value}:00`;
        }

        return value;
      }


      const match =
        value.match(
          /^(\d{1,2}):(\d{2})\s*(AM|PM)$/
        );


      if (!match) {
        return null;
      }


      let hour =
        Number(match[1]);

      const minute =
        match[2];

      const period =
        match[3];


      if (hour < 1 || hour > 12) {
        return null;
      }


      if (period === "AM") {

        if (hour === 12) {
          hour = 0;
        }

      } else {

        if (hour !== 12) {
          hour += 12;
        }
      }


      return (
        String(hour).padStart(2, "0") +
        ":" +
        minute +
        ":00"
      );
    };


    const startTime =
      convertTo24Hour(start_time);


    if (!startTime) {

      await connection.rollback();

      return {
        success: false,
        statusCode: 400,
        message:
          'Invalid start_time. Use format "10:00 AM".',
        data: null
      };
    }

    const [existingSlotRows] =
      await connection.execute(
        `
        SELECT
          id,
          schedule_id,
          doctor_id,
          start_date,
          start_time,
          end_time,
          token_number,
          status
        FROM schedule_slots
        WHERE schedule_id = ?
          AND doctor_id = ?
          AND DATE(start_date) = ?
          AND start_time = ?
        LIMIT 1
        FOR UPDATE
        `,
        [
          schedule.id,
          doctorId,
          appointmentDate,
          startTime
        ]
      );


    let slot = null;

    if (existingSlotRows.length) {

      slot = existingSlotRows[0];

      if (
        String(slot.status).toLowerCase() !== "active"
      ) {

        await connection.rollback();

        return {
          success: false,
          statusCode: 409,
          message:
            "This time slot is already booked. Please select another time.",
          data: null
        };
      }

    }

    else {

      const slotDuration =
        Number(schedule.slot_duration);


      if (
        !Number.isInteger(slotDuration) ||
        slotDuration <= 0
      ) {

        await connection.rollback();

        return {
          success: false,
          statusCode: 400,
          message:
            "Invalid schedule slot duration.",
          data: null
        };
      }

      const [hours, minutes] =
        startTime
          .split(":")
          .map(Number);


      const startMinutes =
        hours * 60 + minutes;


      const endMinutes =
        startMinutes + slotDuration;


      const endHours =
        Math.floor(endMinutes / 60);

      const endMins =
        endMinutes % 60;


      const endTime =
        `${String(endHours).padStart(2, "0")}:` +
        `${String(endMins).padStart(2, "0")}:00`;


      const scheduleStart =
        convertTo24Hour(schedule.start_time);

      const scheduleEnd =
        convertTo24Hour(schedule.end_time);


      if (!scheduleStart || !scheduleEnd) {

        await connection.rollback();

        return {
          success: false,
          statusCode: 400,
          message:
            "Invalid schedule start/end time.",
          data: null
        };
      }


      if (
        startTime < scheduleStart ||
        endTime > scheduleEnd
      ) {

        await connection.rollback();

        return {
          success: false,
          statusCode: 400,
          message:
            "Selected time is outside doctor schedule.",
          data: null
        };
      }

      const [tokenRows] =
        await connection.execute(
          `
          SELECT
            COALESCE(MAX(token_number), 0) + 1
              AS next_token
          FROM schedule_slots
          WHERE schedule_id = ?
            AND doctor_id = ?
            AND DATE(start_date) = ?
          FOR UPDATE
          `,
          [
            schedule.id,
            doctorId,
            appointmentDate
          ]
        );


      const tokenNumber =
        Number(
          tokenRows[0]?.next_token || 1
        );

      const [slotResult] =
        await connection.execute(
          `
          INSERT INTO schedule_slots
          (
            schedule_id,
            doctor_id,
            start_date,
            start_time,
            end_time,
            token_number,
            status
          )
          VALUES (?, ?, ?, ?, ?, ?, 'active')
          `,
          [
            schedule.id,
            doctorId,
            appointmentDate,
            startTime,
            endTime,
            tokenNumber
          ]
        );


      slot = {
        id: slotResult.insertId,
        schedule_id: schedule.id,
        doctor_id: doctorId,
        start_date: appointmentDate,
        start_time: startTime,
        end_time: endTime,
        token_number: tokenNumber,
        status: "active"
      };
    }


    if (
      slot.token_number === null ||
      slot.token_number === undefined
    ) {

      await connection.rollback();

      return {
        success: false,
        statusCode: 400,
        message: "Token number not available.",
        data: null
      };
    }


    const tokenNumber =
      Number(slot.token_number);


    const finalStartTime =
      slot.start_time;


    const finalEndTime =
      slot.end_time;

    const generateUniqueCode = async () => {

      for (let i = 0; i < 20; i++) {

        const code =
          Math.floor(
            1000 + Math.random() * 9000
          ).toString();


        const [rows] =
          await connection.execute(
            `
            SELECT id
            FROM appointments
            WHERE code = ?
            LIMIT 1
            `,
            [code]
          );


        if (!rows.length) {
          return code;
        }
      }


      throw new Error(
        "Unable to generate unique booking code."
      );
    };


    const code =
      await generateUniqueCode();

    const appointmentId =
      await Appointment.create(
        {
          token_number: tokenNumber,

          code,

          appointment_date:
            appointmentDate,

          start_time:
            finalStartTime,

          end_time:
            finalEndTime,

          patient_id:
            null,

          doctor_id:
            doctorId,

          schedule_id:
            schedule.id,

          mode:
            mode || "offline",

          booking_type:
            "someone_else",

          hospital_name:
            schedule.hospital_name,

          reason_for_visit:
            reason_for_visit || null
        },
        connection
      );

    await Appointment.insertOtherPatient(
      {
        appointment_id:
          appointmentId,

        user_id:
          user.id,

        name:
          patient.name,

        age:
          patient.age || null,

        gender:
          patient.gender || null,

        phone:
          patient.phone || null,

        email:
          patient.email || null
      },
      connection
    );

    const [slotUpdate] =
      await connection.execute(
        `
        UPDATE schedule_slots
        SET status = 'inactive'
        WHERE id = ?
          AND status = 'active'
        `,
        [slot.id]
      );


    if (slotUpdate.affectedRows !== 1) {

      await connection.rollback();

      return {
        success: false,
        statusCode: 409,
        message:
          "This slot was booked by another user. Please select another time.",
        data: null
      };
    }

    const endDateTime =
      dayjs(
        `${appointmentDate} ${finalEndTime}`
      );


    const estimatedTime =
      endDateTime
        .add(10, "minute")
        .format("hh:mm A");

    try {

      await notificationService.createNotification({

        userId:
          user.id,

        title:
          "Appointment Booked",

        message:
          `Appointment booked successfully. ` +
          `Token No: ${tokenNumber}. ` +
          `Time: ${finalStartTime} - ${finalEndTime}. ` +
          `Booking Code: ${code}`,

        type:
          "SUCCESS",

        createdBy:
          doctorId
      });

    } catch (notificationError) {

      console.error(
        "Notification Error:",
        notificationError
      );
    }

    await connection.commit();

    if (patient.email) {

      try {

        await sendAppointmentEmail({

          to:
            patient.email,

          code,

          tokenNumber,

          date:
            appointmentDate,

          estimatedTime,

          hospitalName:
            schedule.hospital_name

        });

      } catch (emailError) {

        console.error(
          "Appointment Email Error:",
          emailError
        );
      }
    }

    return {

      success: true,

      statusCode: 201,

      message:
        "Appointment booked successfully.",

      data: {

        appointment_id:
          appointmentId,

        doctor_id:
          doctorId,

        schedule_id:
          schedule.id,

        slot_id:
          slot.id,

        token_number:
          tokenNumber,

        code,

        appointment_date:
          appointmentDate,

        start_time:
          finalStartTime,

        end_time:
          finalEndTime,

        time:
          `${finalStartTime} to ${finalEndTime}`,

        estimated_time:
          estimatedTime,

        hospital_name:
          schedule.hospital_name,

        booking_type:
          "someone_else",

        mode:
          mode || "offline",

        patient: {

          name:
            patient.name,

          age:
            patient.age || null,

          gender:
            patient.gender || null,

          phone:
            patient.phone || null,

          email:
            patient.email || null
        }
      }
    };


  } catch (error) {

    if (connection) {

      try {
        await connection.rollback();
      } catch (rollbackError) {
        console.error(
          "Rollback Error:",
          rollbackError
        );
      }
    }


    console.error(
      "BOOK APPOINTMENT BY ASSISTANT ERROR:",
      error
    );


    return {

      success: false,

      statusCode: 500,

      message:
        error.message ||
        "Internal server error.",

      data: null
    };


  } finally {

    if (connection) {
      connection.release();
    }
  }
};

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

  const slots = await SlotModel.getDoctorSlots(
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
      tokenNumber: slot.token_number,
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