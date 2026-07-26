const db = require("../../config/db");

exports.scanBook = async ({
  user,
  doctorId,
  hospitalName,
  date,
}) => {
  try {
    if (!user?.id) {
      return {
        success: false,
        statusCode: 401,
        body: {
          message: "Unauthorized user.",
        },
      };
    }

    if (!Number.isInteger(doctorId) || doctorId <= 0) {
      return {
        success: false,
        statusCode: 400,
        body: {
          message: "Valid doctor id is required.",
        },
      };
    }

    hospitalName =
      typeof hospitalName === "string"
        ? hospitalName.trim().toLowerCase()
        : "";

    if (!hospitalName) {
      return {
        success: false,
        statusCode: 400,
        body: {
          message: "Hospital name is required.",
        },
      };
    }

    if (!date) {
      return {
        success: false,
        statusCode: 400,
        body: {
          message: "Date is required.",
        },
      };
    }

    const [users] = await db.execute(
      `
      SELECT
        id,
        full_name
      FROM users
      WHERE id = ?
      LIMIT 1
      `,
      [user.id]
    );

    if (!users.length) {
      return {
        success: false,
        statusCode: 404,
        body: {
          message: "Patient not found.",
        },
      };
    }

    const [scheduleRows] = await db.execute(
      `
      SELECT
        offlinepatient_number AS totalSlots
      FROM schedules
      WHERE doctor_id = ?
      AND LOWER(TRIM(hospital_name)) LIKE ?
      AND status = 'active'
      ORDER BY id DESC
      LIMIT 1
      `,
      [
        doctorId,
        `%${hospitalName}%`,
      ]
    );

    if (!scheduleRows.length) {
      return {
        success: false,
        statusCode: 404,
        body: {
          message: "Schedule not found.",
        },
      };
    }

    const totalSlots =
      Number(scheduleRows[0].totalSlots);

    if (!totalSlots || totalSlots <= 0) {
      return {
        success: false,
        statusCode: 400,
        body: {
          message:
            "Offline slots are not configured.",
        },
      };
    }

    const [appointmentCount] =
      await db.execute(
        `
        SELECT
          COUNT(*) AS booked
        FROM appointments
        WHERE doctor_id = ?
        AND LOWER(TRIM(hospital_name)) LIKE ?
        AND DATE(slot_date) = ?
        AND appointment_type = 'offline'
        `,
        [
          doctorId,
          `%${hospitalName}%`,
          date,
        ]
      );

    const booked =
      Number(appointmentCount[0].booked);

    if (booked >= totalSlots) {
      return {
        success: false,
        statusCode: 409,
        body: {
          message:
            "All offline slots are booked for today.",
        },
      };
    }

    const token = booked + 1;

    const [result] = await db.execute(
      `
      INSERT INTO appointments
      (
        doctor_id,
        patient_id,
        slot_date,
        token_number,
        appointment_type,
        hospital_name
      )
      VALUES
      (
        ?,
        ?,
        ?,
        ?,
        'offline',
        ?
      )
      `,
      [
        doctorId,
        user.id,
        date,
        token,
        hospitalName,
      ]
    );

    return {
      success: true,
      statusCode: 201,
      body: {
        message:
          "Appointment booked successfully.",
        data: {
          appointment_id: result.insertId,
          doctor_id: doctorId,
          patient_id: user.id,
          token_number: token,
          slot_date: date,
          appointment_type: "offline",
          hospital_name: hospitalName,
        },
      },
    };

  } catch (error) {

    console.error(
      "SCAN BOOK APPOINTMENT SERVICE ERROR:",
      error
    );

    return {
      success: false,
      statusCode: 500,
      body: {
        message: "Internal Server Error.",
      },
    };
  }
};