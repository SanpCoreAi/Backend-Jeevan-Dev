const db = require("../config/db");

exports.create = async (data) => {

  const sql = `
    INSERT INTO appointments
    (
      token_number,
      slot_date,
      start_time,
      end_time,
      patient_id,
      doctor_id,
      schedule_id,
      appointment_type,
      booking_type,
      hospital_name,
      reason_for_visit
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  const [res] = await db.query(sql, [
    data.appointment_token,
    data.appointment_date,
    data.start_time,
    data.end_time,
    data.patient_id,
    data.doctor_id,
    data.schedule_id,
    data.mode,
    data.booking_type,
    data.hospital_name,
    data.reason_for_visit
  ]);

  return res.insertId;
};

exports.insertOtherPatient = async ({
  appointment_id,
  user_id,
  name,
  age,
  gender,
  phone,
  email
}) => {

  const sql = `
    INSERT INTO appointment_patients
    (
      appointment_id,
      user_id,
      patient_name,
      age,
      gender,
      patient_phone,
      patient_email
    )
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `;

  const [result] = await db.query(sql, [
    appointment_id,
    user_id,
    name,
    age,
    gender,
    phone,
    email
  ]);

  return result.insertId;
};



exports.getAppointmentPublicById = async (patientId) => {
  const [rows] = await db.query(
    `
    SELECT *
    FROM appointments
    WHERE patient_id = ?
    ORDER BY id DESC
    `,
    [patientId]
  );

  return rows;
};

exports.getDashboardStats = async (doctorId) => {
  const [rows] = await db.query(
    `
    SELECT
    COUNT(
        CASE
            WHEN DATE(slot_date) = CURDATE()
            THEN 1
        END
    ) AS todayAppointments,

    COUNT(
        CASE
            WHEN DATE(slot_date) = CURDATE()
            AND created_at IS NOT NULL
            THEN 1
        END
    ) AS todayCompleted,

    COUNT(
        CASE
            WHEN DATE(slot_date) = CURDATE()
            AND status = 'CANCELLED'
            THEN 1
        END
    ) AS todayCancelled,

    COUNT(
        CASE
            WHEN DATE(slot_date) > CURDATE()
            THEN 1
        END
    ) AS upcomingAppointments

FROM appointments
WHERE doctor_id = ?
AND is_deleted = 0;
    `,
    [doctorId]
  );

  return rows[0];
};

exports.getDoctorAppointmentsForTable = async (
  doctorId,
  hospitalName,
  mode,
  slot_date,
  status,
  limit,
  offset
) => {

  let query = `
    SELECT
      COALESCE(u.full_name,'Unknown') AS name,
      u.phone_number,
      d.specialization AS diagnostic,

      DATE_FORMAT(a.slot_date,'%d-%m-%Y') AS date,
      DATE_FORMAT(a.start_time,'%h:%i %p') AS time,

      a.id AS appointment_id,
      a.token_number,
      a.appointment_type AS mode,
      COALESCE(a.hospital_name,'Online') AS hospital_name,
      a.status,
      DATE_FORMAT(a.created_at,'%d-%m-%Y %h:%i %p') AS booked_at

    FROM appointments a

    LEFT JOIN users u
      ON u.id = a.patient_id

    LEFT JOIN doctors d
      ON d.user_id = a.doctor_id

    WHERE a.doctor_id = ?
  `;

  const params = [doctorId];

  // Hospital Filter
  if (hospitalName) {
    query += `
      AND LOWER(TRIM(a.hospital_name)) = LOWER(TRIM(?))
    `;
    params.push(hospitalName);
  }

  // Mode Filter
  if (mode) {
    query += `
      AND LOWER(a.appointment_type) = LOWER(?)
    `;
    params.push(mode);
  }

  // Status Filter
  if (status) {
    query += `
      AND LOWER(a.status) = LOWER(?)
    `;
    params.push(status);
  } else {
    query += `
      AND LOWER(a.status) IN ('pending','in_progress')
    `;
  }

  // Slot Date Filter
  if (slot_date) {
    query += `
      AND DATE(a.slot_date) = ?
    `;
    params.push(slot_date);
  }

  query += `
    ORDER BY
      a.slot_date DESC,
      a.start_time ASC,
      a.token_number ASC
    LIMIT ? OFFSET ?
  `;

  params.push(Number(limit), Number(offset));

  const [rows] = await db.query(query, params);

  // ================= COUNT QUERY =================

  let countQuery = `
    SELECT COUNT(*) AS total
    FROM appointments a
    WHERE a.doctor_id = ?
  `;

  const countParams = [doctorId];

  if (hospitalName) {
    countQuery += `
      AND LOWER(TRIM(a.hospital_name)) = LOWER(TRIM(?))
    `;
    countParams.push(hospitalName);
  }

  if (mode) {
    countQuery += `
      AND LOWER(a.appointment_type) = LOWER(?)
    `;
    countParams.push(mode);
  }

  if (status) {
    countQuery += `
      AND LOWER(a.status) = LOWER(?)
    `;
    countParams.push(status);
  } else {
    countQuery += `
      AND LOWER(a.status) IN ('pending','in_progress')
    `;
  }

  // Slot Date Filter
  if (slot_date) {
    countQuery += `
      AND DATE(a.slot_date) = ?
    `;
    countParams.push(slot_date);
  }

  const [[countResult]] = await db.query(countQuery, countParams);

  return {
    rows,
    total: countResult.total
  };
};

exports.getAppointmentForCancel = async (
  appointmentId,
  patientId
) => {

  const [rows] = await db.query(
    `
    SELECT
      id,
      doctor_id,
      patient_id,
      schedule_id,
      slot_date,
      start_time,
      status
    FROM appointments
    WHERE id = ?
      AND patient_id = ?
    LIMIT 1
    `,
    [appointmentId, patientId]
  );

  return rows[0] || null;
};

exports.cancelAppointment = async (
  appointmentId,
  reason
) => {

  await db.query(
    `
    UPDATE appointments
    SET
      status = 'cancelled',
      cancel_reason = ?
    WHERE id = ?
    `,
    [reason, appointmentId]
  );

};

exports.autoCancelPendingAppointments = async () => {
  const sql = `
    UPDATE appointments
    SET status = 'CANCELLED'
    WHERE status = 'PENDING'
      AND slot_date < CURDATE()
  `;

  const [result] = await db.execute(sql);

  console.log("Cancelled:", result.affectedRows);

  return result;
};

exports.getAppointmentById = async (doctorId) => {
  const [rows] = await db.query(
    `
   SELECT 
    a.id AS appointment_id,
    COALESCE(u.full_name, 'Unknown') AS name,
    u.phone_number AS phone,
    u.email,
    up.gender AS sex,
    up.age,
    up.weight,
    up.height,
    up.blood_group,
    a.token_number,
    a.appointment_type AS mode,
    a.hospital_name,
    DATE_FORMAT(a.slot_date, '%d %b %Y') AS visit_date,
    d.specialization AS diagnosis,
    'Paid' AS payment_status,
    'New' AS visit_type,
    'Fever' AS diagnosis_text,
    'Feeling unwell due to fever; resting and monitoring symptoms.' AS note

FROM appointments a

LEFT JOIN users u 
    ON u.id = a.patient_id

LEFT JOIN (
    SELECT up1.*
    FROM user_profiles up1
    INNER JOIN (
        SELECT user_id, MAX(id) AS max_id
        FROM user_profiles
        GROUP BY user_id
    ) latest
    ON up1.id = latest.max_id
) up
    ON up.user_id = u.id

LEFT JOIN doctors d 
    ON d.id = a.doctor_id

WHERE a.doctor_id = ?
ORDER BY a.id DESC;
    `,
    [doctorId]
  );

  return rows;
};

exports.countTodayAppointments = async (
  patientId,
  appointmentDate
) => {

  const [rows] = await db.query(
    `
    SELECT COUNT(*) AS total
    FROM appointments
    WHERE patient_id = ?
      AND DATE(slot_date) = ?
      AND status != 'CANCELLED'
    `,
    [patientId, appointmentDate]
  );

  return Number(rows[0].total);
};

exports.getByIdAndPatient = async (patientId) => {

  const [rows] = await db.query(
    `
    SELECT a.*
    FROM appointments a
    JOIN appointment_patients ap 
      ON ap.appointment_id = a.id
    WHERE ap.user_id = ?
    `,
    [patientId]
  );

  return rows[0];
};

exports.getAppointmentDetails = async (doctorId, appointmentId) => {
  const [rows] = await db.query(
    `
    SELECT
      a.id AS appointment_id,
      a.token_number,
      a.slot_date,
      a.start_time,
      a.end_time,
      a.appointment_type,
      a.booking_type,
      a.hospital_name,
      a.status,

      u.id AS patient_id,
      COALESCE(u.full_name, ap.patient_name) AS patient_name,
      COALESCE(u.phone_number, ap.patient_phone) AS phone_number,
      COALESCE(u.email, ap.patient_email) AS email,

      COALESCE(up.gender, ap.gender) AS gender,
      COALESCE(up.age, ap.age) AS age,
      up.weight,
      up.height,
      up.blood_group,

      d.specialization

    FROM appointments a

    LEFT JOIN users u
      ON u.id = a.patient_id

    LEFT JOIN appointment_patients ap
      ON ap.appointment_id = a.id

    LEFT JOIN user_profiles up
      ON up.user_id = u.id

    LEFT JOIN doctors d
      ON d.id = a.doctor_id

    WHERE a.doctor_id = ?
      AND a.id = ?
    LIMIT 1
    `,
    [doctorId, appointmentId]
  );

  return rows[0] || null;
};

exports.getAllByPatient = async (userId) => {

  const [rows] = await db.query(`
    SELECT 
      a.*,
      ap.patient_name,
      ap.age,
      ap.gender,
      ap.patient_phone,
      ap.patient_email,
      u.full_name AS doctor_name,
      d.specialization AS doctor_department
    FROM appointments a
    LEFT JOIN appointment_patients ap 
      ON ap.appointment_id = a.id
    LEFT JOIN doctors d 
      ON d.user_id = a.doctor_id
    LEFT JOIN users u 
      ON u.id = a.doctor_id
    WHERE a.patient_id = ? 
       OR a.doctor_id = ?
    ORDER BY a.slot_date DESC
  `, [userId, userId]);

  return rows;
};

exports.getAppointments = async ({
  doctorId,
  limit,
  offset
}) => {
  try {
    const todayDate = new Date().toLocaleDateString("en-CA", {
      timeZone: "Asia/Kolkata"
    });

    const query = `
      SELECT
        a.id AS appointment_id,

        DATE_FORMAT(a.slot_date, '%Y-%m-%d') AS slot_date,

        TIME_FORMAT(a.start_time, '%h:%i %p') AS start_time,

        a.status,
        a.reason_for_visit,

        u.id AS patient_id,

        COALESCE(u.full_name, ap.patient_name, '') AS patient_name,

        COALESCE(u.phone_number, ap.patient_phone) AS phone_number,
        COALESCE(u.email, ap.patient_email) AS email,

        COALESCE(up.age, ap.age) AS age,
        COALESCE(up.gender, ap.gender) AS gender,
        up.weight,
        up.height,
        up.blood_group,
        up.language,
        up.existing_conditions,
        up.allergies,
        up.address

      FROM appointments a

      LEFT JOIN users u
        ON u.id = a.patient_id

      LEFT JOIN appointment_patients ap
        ON ap.appointment_id = a.id

      LEFT JOIN user_profiles up
        ON up.id = (
          SELECT id
          FROM user_profiles
          WHERE user_id = u.id
          ORDER BY id DESC
          LIMIT 1
        )

      WHERE a.doctor_id = ?
        AND a.slot_date = ?

      ORDER BY
        a.slot_date DESC,
        a.start_time ASC

      LIMIT ?
      OFFSET ?;
    `;

    const [rows] = await db.query(query, [
      doctorId,
      todayDate,
      Number(limit),
      Number(offset)
    ]);

    const countQuery = `
      SELECT COUNT(*) AS total
      FROM appointments
      WHERE doctor_id = ?
        AND slot_date = ?;
    `;

    const [[countResult]] = await db.query(countQuery, [
      doctorId,
      todayDate
    ]);

    return {
      rows,
      total: countResult.total
    };

  } catch (error) {
    throw error;
  }
};


  exports.getDashboardCards =
  async ({ doctorId }) => {

    const query = `

      SELECT

        COUNT(*) AS total_appointment,

        -- pending = upcoming
        COUNT(
          CASE
            WHEN status = 'pending'
            THEN 1
          END
        ) AS total_upcoming,

        -- completed
        COUNT(
          CASE
            WHEN status = 'completed'
            THEN 1
          END
        ) AS total_completed,

        -- expired
        COUNT(
          CASE
            WHEN status = 'expired'
            THEN 1
          END
        ) AS total_expired

      FROM appointments

      WHERE doctor_id = ?

    `;

    const [rows] =
      await db.query(query, [doctorId]);

    return rows[0];
  };

exports.getPatientDashboardCards = async ({
  doctorId,
  filter,
}) => {

  let dateCondition = "";

  switch (filter) {
    case "day":
      dateCondition = "DATE(slot_date) = CURDATE()";
      break;

    case "week":
      dateCondition = "YEARWEEK(slot_date, 1) = YEARWEEK(CURDATE(), 1)";
      break;

    case "month":
      dateCondition =
        "MONTH(slot_date) = MONTH(CURDATE()) AND YEAR(slot_date) = YEAR(CURDATE())";
      break;

    case "year":
      dateCondition = "YEAR(slot_date) = YEAR(CURDATE())";
      break;

    default:
      dateCondition = "DATE(slot_date) = CURDATE()";
  }

  const query = `
    SELECT

      -- Total Online Patients
      COUNT(
        CASE
          WHEN appointment_type = 'online'
          AND ${dateCondition}
          THEN 1
        END
      ) AS online_patient,

      -- Total Offline Patients
      COUNT(
        CASE
          WHEN appointment_type = 'offline'
          AND ${dateCondition}
          THEN 1
        END
      ) AS offline_patient,

      -- Online Pending
      COUNT(
        CASE
          WHEN appointment_type = 'online'
          AND status = 'PENDING'
          AND ${dateCondition}
          THEN 1
        END
      ) AS online_pending,

      -- Offline Pending
      COUNT(
        CASE
          WHEN appointment_type = 'offline'
          AND status = 'PENDING'
          AND ${dateCondition}
          THEN 1
        END
      ) AS offline_pending,

      -- Online Completed
      COUNT(
        CASE
          WHEN appointment_type = 'online'
          AND status = 'COMPLETED'
          AND ${dateCondition}
          THEN 1
        END
      ) AS online_complete,

      -- Offline Completed
      COUNT(
        CASE
          WHEN appointment_type = 'offline'
          AND status = 'COMPLETED'
          AND ${dateCondition}
          THEN 1
        END
      ) AS offline_complete

    FROM appointments
    WHERE doctor_id = ?;
  `;

  const [rows] = await db.query(query, [doctorId]);

  return rows[0];
};

exports.checkUserSameSlot = async (patientId, date, timeSlot) => {

  const [start, end] = timeSlot.split(" - ").map(t => parse12to24(t));

  const [rows] = await db.query(
    `
    SELECT a.id
    FROM appointments a
    JOIN appointment_patients ap 
      ON ap.appointment_id = a.id
    WHERE ap.user_id = ?
      AND a.slot_date = ?
      AND a.start_time = ?
      AND a.end_time = ?
    `,
    [patientId, date, start, end]
  );

  return rows.length > 0;
};

exports.getNextTokenNumber = async (
  doctorId,
  appointmentDate,
  hospitalName
) => {

  const [rows] = await db.execute(
    `
    SELECT COALESCE(MAX(token_number), 0) + 1 AS nextToken
    FROM appointments
    WHERE doctor_id = ?
      AND DATE(slot_date) = ?
      AND LOWER(TRIM(hospital_name)) = LOWER(TRIM(?))
    `,
    [
      doctorId,
      appointmentDate,
      hospitalName
    ]
  );

  return rows[0].nextToken;
};