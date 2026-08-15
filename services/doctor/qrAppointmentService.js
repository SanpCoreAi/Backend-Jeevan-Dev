const db = require("../../config/db");
const dayjs = require("dayjs");

const notificationService = require("../notification/notificationService");
const { sendAppointmentEmails } = require("../../utils/sendEmail");


const generateUniqueCode = async (
  connection,
  doctorId,
  appointmentDate
) => {

  let code;
  let exists = true;

  while (exists) {

    code = Math.floor(
      1000 + Math.random() * 9000
    );

    const [rows] =
      await connection.execute(
        `
        SELECT id
        FROM appointments
        WHERE doctor_id = ?
          AND DATE(slot_date) = ?
          AND code = ?
        LIMIT 1
        `,
        [
          doctorId,
          appointmentDate,
          code
        ]
      );

    exists = rows.length > 0;
  }

  return code;
};


const formatTime = (time) => {

  if (!time) {
    return null;
  }

  const parts =
    String(time).split(":");

  let hour =
    Number(parts[0]);

  const minute =
    parts[1] || "00";

  const period =
    hour >= 12 ? "PM" : "AM";

  hour =
    hour % 12 || 12;

  return `${String(hour).padStart(2, "0")}:${minute} ${period}`;
};


const getEstimatedTime = (startTime) => {
  if (!startTime) {
    return null;
  }

  const value = String(startTime).trim();

  let hour;
  let minute;

  // DB format: 10:00:00 / 10:00
  const dbTimeMatch = value.match(
    /^(\d{1,2}):(\d{2})(?::\d{2})?$/
  );

  // Request/display format: 10:00 AM
  const amPmMatch = value.match(
    /^(\d{1,2}):(\d{2})\s*(AM|PM)$/i
  );

  if (dbTimeMatch) {
    hour = Number(dbTimeMatch[1]);
    minute = Number(dbTimeMatch[2]);

  } else if (amPmMatch) {
    hour = Number(amPmMatch[1]);
    minute = Number(amPmMatch[2]);

    const period = amPmMatch[3].toUpperCase();

    if (period === "AM" && hour === 12) {
      hour = 0;
    }

    if (period === "PM" && hour !== 12) {
      hour += 12;
    }

  } else {
    return null;
  }

  // Estimated Time = Start Time + 30 minutes
  let totalMinutes =
    hour * 60 + minute + 30;

  totalMinutes =
    totalMinutes % (24 * 60);

  let estimatedHour =
    Math.floor(totalMinutes / 60);

  const estimatedMinute =
    totalMinutes % 60;

  const estimatedPeriod =
    estimatedHour >= 12
      ? "PM"
      : "AM";

  estimatedHour =
    estimatedHour % 12;

  if (estimatedHour === 0) {
    estimatedHour = 12;
  }

  return `${String(estimatedHour).padStart(2, "0")}:${String(
    estimatedMinute
  ).padStart(2, "0")} ${estimatedPeriod}`;
};

exports.scanBook = async ({
  user,
  doctorId,
  hospitalName,
  date,
  start_time,
  tokenNumber
}) => {

  let connection = null;

  try {

    connection = await db.getConnection();

    await connection.beginTransaction();

    if (!user || !user.id) {

      await connection.rollback();

      return {
        success: false,
        statusCode: 401,

        body: {
          message: "Unauthorized user.",
          data: null
        }
      };
    }


    const patientId = Number(user.id);

    doctorId = Number(doctorId);

    if (
      !Number.isInteger(doctorId) ||
      doctorId <= 0
    ) {

      await connection.rollback();

      return {
        success: false,
        statusCode: 400,

        body: {
          message: "Valid doctor id is required.",
          data: null
        }
      };
    }

    hospitalName =
      typeof hospitalName === "string"
        ? hospitalName.trim()
        : "";


    if (!hospitalName) {

      await connection.rollback();

      return {
        success: false,
        statusCode: 400,

        body: {
          message: "Hospital name is required.",
          data: null
        }
      };
    }

    if (!date) {

      await connection.rollback();

      return {
        success: false,
        statusCode: 400,

        body: {
          message: "Appointment date is required.",
          data: null
        }
      };
    }


    const appointmentDate =
      dayjs(date).format("YYYY-MM-DD");


    if (
      !dayjs(
        appointmentDate,
        "YYYY-MM-DD",
        true
      ).isValid()
    ) {

      await connection.rollback();

      return {
        success: false,
        statusCode: 400,

        body: {
          message: "Invalid appointment date.",
          data: null
        }
      };
    }

    if (
      !start_time ||
      typeof start_time !== "string"
    ) {

      await connection.rollback();

      return {
        success: false,
        statusCode: 400,

        body: {
          message: "Start time is required.",
          data: null
        }
      };
    }


    const requestedStartTime =
      start_time.trim();

    tokenNumber = Number(tokenNumber);


    if (
      !Number.isInteger(tokenNumber) ||
      tokenNumber <= 0
    ) {

      await connection.rollback();

      return {
        success: false,
        statusCode: 400,

        body: {
          message: "Valid token number is required.",
          data: null
        }
      };
    }

    const [patientRows] =
      await connection.execute(
        `
        SELECT
          id,
          full_name,
          email
        FROM users
        WHERE id = ?
        LIMIT 1
        `,
        [patientId]
      );


    if (!patientRows.length) {

      await connection.rollback();

      return {
        success: false,
        statusCode: 404,

        body: {
          message: "Patient not found.",
          data: null
        }
      };
    }


    const patient =
      patientRows[0];

    const [doctorRows] =
      await connection.execute(
        `
        SELECT
          id,
          user_id
        FROM doctors
        WHERE user_id = ?
        LIMIT 1
        `,
        [doctorId]
      );


    if (!doctorRows.length) {

      await connection.rollback();

      return {
        success: false,
        statusCode: 404,

        body: {
          message: "Doctor not found.",
          data: null
        }
      };
    }


    const [scheduleRows] =
      await connection.execute(
        `
        SELECT
          id,
          doctor_id,
          hospital_name,
          status,
          start_date,
          end_date,
          active_days
        FROM schedules
        WHERE doctor_id = ?
          AND LOWER(TRIM(hospital_name))
              = LOWER(TRIM(?))
          AND LOWER(status) = 'active'
          AND DATE(start_date) <= ?
          AND DATE(end_date) >= ?
        ORDER BY id DESC
        `,
        [
          doctorId,
          hospitalName,
          appointmentDate,
          appointmentDate
        ]
      );


    if (!scheduleRows.length) {

      await connection.rollback();

      return {
        success: false,
        statusCode: 404,

        body: {
          message:
            "Doctor schedule not found for this hospital/date.",
          data: null
        }
      };
    }


    const appointmentDay =
      dayjs(appointmentDate).format("ddd");


    let schedule = null;


    for (
      const currentSchedule
      of scheduleRows
    ) {

      let activeDays =
        currentSchedule.active_days;


      if (
        typeof activeDays === "string"
      ) {

        try {

          activeDays =
            JSON.parse(activeDays);

        } catch (error) {

          activeDays = [];

        }
      }


      if (
        !Array.isArray(activeDays)
      ) {

        activeDays = [];

      }


      if (
        activeDays.includes(
          appointmentDay
        )
      ) {

        schedule =
          currentSchedule;

        break;
      }
    }


    if (!schedule) {

      await connection.rollback();

      return {
        success: false,
        statusCode: 400,

        body: {
          message:
            `Doctor is not available on ${appointmentDay}.`,
          data: null
        }
      };
    }


    const [bookingRows] =
      await connection.execute(
        `
        SELECT
          COUNT(*) AS total
        FROM appointments
        WHERE patient_id = ?
          AND DATE(slot_date) = ?
          AND status != 'CANCELLED'
        `,
        [
          patientId,
          appointmentDate
        ]
      );


    const totalAppointments =
      Number(
        bookingRows[0]?.total || 0
      );


    if (
      totalAppointments >= 2
    ) {

      await connection.rollback();

      return {
        success: false,
        statusCode: 400,

        body: {
          message:
            "You can book maximum 2 slots in a day.",
          data: null
        }
      };
    }



    const [slotRows] =
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
          AND token_number = ?
          AND TIME(start_time) = TIME(?)
          AND LOWER(status) = 'active'
        LIMIT 1
        FOR UPDATE
        `,
        [
          schedule.id,
          doctorId,
          appointmentDate,
          tokenNumber,
          requestedStartTime
        ]
      );


    if (!slotRows.length) {

      await connection.rollback();

      return {
        success: false,
        statusCode: 409,

        body: {
          message:
            `Token ${tokenNumber} with start time ${requestedStartTime} is not available for this date.`,
          data: null
        }
      };
    }


    const slot =
      slotRows[0];


    if (
      String(slot.status).toLowerCase() !== "active"
    ) {

      await connection.rollback();

      return {
        success: false,
        statusCode: 409,

        body: {
          message:
            "This slot is already booked. Please select another slot.",
          data: null
        }
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

        body: {
          message:
            "Token number is not available for this slot.",
          data: null
        }
      };
    }

    const startTime =
      slot.start_time;

    const endTime =
      slot.end_time;


    if (
      !startTime ||
      !endTime
    ) {

      await connection.rollback();

      return {
        success: false,
        statusCode: 400,

        body: {
          message:
            "Slot time is not available.",
          data: null
        }
      };
    }


    const formattedStartTime =
      formatTime(startTime);


    const formattedEndTime =
      formatTime(endTime);

    const estimatedTime =
      getEstimatedTime(startTime);


    const code =
      await generateUniqueCode(
        connection,
        doctorId,
        appointmentDate
      );

    const [appointmentResult] =
      await connection.execute(
        `
        INSERT INTO appointments
        (
          token_number,
          code,
          slot_date,
          start_time,
          end_time,
          patient_id,
          doctor_id,
          schedule_id,
          appointment_type,
          booking_type,
          hospital_name,
          status
        )
        VALUES
        (
          ?,
          ?,
          ?,
          ?,
          ?,
          ?,
          ?,
          ?,
          'offline',
          'myself',
          ?,
          'PENDING'
        )
        `,
        [
          tokenNumber,
          code,
          appointmentDate,
          startTime,
          endTime,
          patientId,
          doctorId,
          schedule.id,
          schedule.hospital_name
        ]
      );


    const appointmentId =
      appointmentResult.insertId;

    const [slotUpdateResult] =
      await connection.execute(
        `
        UPDATE schedule_slots
        SET status = 'inactive'
        WHERE id = ?
          AND LOWER(status) = 'active'
        `,
        [slot.id]
      );


    if (
      slotUpdateResult.affectedRows !== 1
    ) {

      await connection.rollback();

      return {
        success: false,
        statusCode: 409,

        body: {
          message:
            "Slot was already booked. Please try again.",
          data: null
        }
      };
    }

    try {

      await notificationService.createNotification({

        userId:
          patientId,

        title:
          "Appointment Booked",

        message:
          `Your appointment has been booked successfully. ` +
          `Token No: ${tokenNumber}. ` +
          `Booking Code: ${code}. ` +
          `Time: ${formattedStartTime} - ${formattedEndTime}`,

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

    try {

      if (patient.email) {

        await sendAppointmentEmails({

          to:
            patient.email,

          tokenNumber:
            tokenNumber,

          code:
            code,

          date:
            appointmentDate,

          estimatedTime:
            estimatedTime,

          hospitalName:
            schedule.hospital_name
        });
      }

    } catch (emailError) {

      console.error(
        "Appointment Email Error:",
        emailError
      );
    }


    return {

      success: true,

      statusCode: 201,

      body: {

        message:
          "Appointment booked successfully.",

        data: {

          appointment_id:
            appointmentId,

          code:
            code,

          token_number:
            tokenNumber,

          doctor_id:
            doctorId,

          patient_id:
            patientId,

          schedule_id:
            schedule.id,

          slot_id:
            slot.id,

          appointment_type:
            "offline",

          booking_type:
            "myself",

          hospital_name:
            schedule.hospital_name,

          slot_date:
            appointmentDate,

          start_time:
            formattedStartTime,

          end_time:
            formattedEndTime,

          estimated_time:
            estimatedTime,

          status:
            "PENDING"
        }
      }
    };


  } catch (error) {

    try {

      if (connection) {
        await connection.rollback();
      }

    } catch (rollbackError) {

      console.error(
        "Rollback Error:",
        rollbackError
      );
    }


    console.error(
      "QR APPOINTMENT ERROR:",
      error
    );


    return {

      success: false,

      statusCode: 500,

      body: {

        message:
          error.message ||
          "Internal Server Error.",

        data: null
      }
    };


  } finally {

    if (connection) {
      connection.release();
    }

  }
};