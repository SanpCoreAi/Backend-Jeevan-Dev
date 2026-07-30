const db = require("../../config/db");
const dayjs = require("dayjs");

const Appointment = require("../../models/appointment");
const notificationService = require("../notification/notificationService");
const { sendAppointmentEmail } = require("../../utils/sendEmail");

exports.scanBook = async ({
  user,
  doctorId,
  hospitalName,
  date,
}) => {

  const connection = await db.getConnection();

  try {

    await connection.beginTransaction();

    if (!user?.id) {

      await connection.rollback();

      return {
        success: false,
        statusCode: 401,
        body: {
          message: "Unauthorized user."
        }
      };

    }

    if (
      !Number.isInteger(doctorId) ||
      doctorId <= 0
    ) {

      await connection.rollback();

      return {
        success: false,
        statusCode: 400,
        body: {
          message: "Valid doctor id is required."
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
          message: "Hospital name is required."
        }
      };

    }

    if (!date) {

      await connection.rollback();

      return {
        success: false,
        statusCode: 400,
        body: {
          message: "Date is required."
        }
      };

    }

    const appointmentDate =
      dayjs(date).format("YYYY-MM-DD");

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
        [user.id]
      );

    if (!patientRows.length) {

      await connection.rollback();

      return {
        success: false,
        statusCode: 404,
        body: {
          message: "Patient not found."
        }
      };

    }

    const patient =
      patientRows[0];

    const [doctorRows] =
      await connection.execute(
        `
        SELECT
          id
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
          message: "Doctor not found."
        }
      };

    }

    const doctor =
      doctorRows[0];


const [scheduleRows] = await connection.execute(
`
SELECT
    id,
    hospital_name,
    offlinepatient_number,
    status,
    start_date,
    end_date,
    active_days
FROM schedules
WHERE doctor_id = ?
LIMIT 1
`,
[doctorId]
);

console.log(scheduleRows);

    if (!scheduleRows.length) {

      await connection.rollback();

      return {
        success: false,
        statusCode: 404,
        body: {
          message: "Doctor schedule not found."
        }
      };

    }

    const schedule =
      scheduleRows[0];

    if (
      appointmentDate <
        dayjs(schedule.start_date).format("YYYY-MM-DD") ||

      appointmentDate >
        dayjs(schedule.end_date).format("YYYY-MM-DD")
    ) {

      await connection.rollback();

      return {
        success: false,
        statusCode: 400,
        body: {
          message: "Doctor is not available on this date."
        }
      };

    }

    let activeDays = schedule.active_days;

    if (typeof activeDays === "string") {

      try {

        activeDays = JSON.parse(activeDays);

      } catch (error) {

        activeDays = [];

      }

    }

    const today =
      dayjs(appointmentDate).format("ddd");

    if (!activeDays.includes(today)) {

      await connection.rollback();

      return {
        success: false,
        statusCode: 400,
        body: {
          message: "Doctor is not available today."
        }
      };

    }

    const totalSlots =
      Number(schedule.offlinepatient_number);

    if (
      !totalSlots ||
      totalSlots <= 0
    ) {

      await connection.rollback();

      return {
        success: false,
        statusCode: 400,
        body: {
          message: "Offline patient limit is not configured."
        }
      };

    }

const [bookingRows] = await connection.execute(
  `
  SELECT COUNT(*) AS total
  FROM appointments
  WHERE patient_id = ?
    AND DATE(slot_date) = ?
    AND status IN ('PENDING', 'IN_PROGRESS')
  `,
  [
    user.id,
    appointmentDate
  ]
);

if (bookingRows[0].total >= 2) {

  await connection.rollback();

  return {
    success: false,
    statusCode: 400,
    body: {
      message: "You can book only 2 appointments in a day."
    }
  };

}

    const [duplicateRows] =
      await connection.execute(
        `
        SELECT id
        FROM appointments
        WHERE doctor_id = ?
          AND patient_id = ?
          AND DATE(slot_date) = ?
          AND appointment_type = 'offline'
          AND status IN ('PENDING','IN_PROGRESS')
        LIMIT 1
        `,
        [
          doctorId,
          user.id,
          appointmentDate
        ]
      );

    if (duplicateRows.length) {

      await connection.rollback();

      return {
        success: false,
        statusCode: 409,
        body: {
          message:
            "You already have an active offline appointment for today."
        }
      };

    }

    const [countRows] =
      await connection.execute(
        `
        SELECT COUNT(*) AS booked
        FROM appointments
        WHERE doctor_id = ?
          AND DATE(slot_date) = ?
          AND appointment_type = 'offline'
          AND LOWER(TRIM(hospital_name))
              = LOWER(TRIM(?))
          AND status != 'CANCELLED'
        `,
        [
          doctorId,
          appointmentDate,
          hospitalName
        ]
      );

    if (
      Number(countRows[0].booked) >= totalSlots
    ) {

      await connection.rollback();

      return {
        success: false,
        statusCode: 409,
        body: {
          message:
            "All offline slots are booked for today."
        }
      };

    }

    const [tokenRows] =
      await connection.execute(
        `
        SELECT
          COALESCE(MAX(token_number), 0) + 1
          AS token
        FROM appointments
        WHERE doctor_id = ?
          AND DATE(slot_date) = ?
          AND appointment_type = 'offline'
          AND LOWER(TRIM(hospital_name))
              = LOWER(TRIM(?))
        FOR UPDATE
        `,
        [
          doctorId,
          appointmentDate,
          hospitalName
        ]
      );

    const token =
      Number(tokenRows[0].token);

    const [result] =
      await connection.execute(
        `
        INSERT INTO appointments
        (
          token_number,
          slot_date,
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
          'offline',
          'myself',
          ?,
          'PENDING'
        )
        `,
        [
          token,
          appointmentDate,
          user.id,
          doctorId,
          schedule.id,
          schedule.hospital_name
        ]
      );

    try {

      await notificationService.createNotification({
        userId: user.id,
        title: "Appointment Booked",
        message:
          `Your offline appointment has been booked successfully. Token No: ${token}`,

        type: "SUCCESS",

        createdBy: doctorId

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

        await sendAppointmentEmail({
          to: patient.email,
          token,
          date: appointmentDate,
          time: "Offline Visit"

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

        message: "Appointment booked successfully.",

        data: {
          appointment_id: result.insertId,
          token_number: token,
          doctor_id: doctorId,
          patient_id: user.id,
          schedule_id: schedule.id,
          appointment_type: "offline",
          booking_type: "myself",
          hospital_name: schedule.hospital_name,
          slot_date: appointmentDate,
          status: "PENDING"

        }

      }

    };
      } catch (error) {

    console.error(
      "QR APPOINTMENT ERROR:",
      error
    );

    try {

      await connection.rollback();

    } catch (rollbackError) {

      console.error(
        "Rollback Error:",
        rollbackError
      );

    }

    return {
      success: false,
      statusCode: 500,
      body: {
        message: "Internal Server Error."
      }

    };

  } finally {

    connection.release();

  }

};