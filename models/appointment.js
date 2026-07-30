const db = require("../config/db");
const { parse12to24 } = require("../utils/timeHelper");

exports.getConnection = async () => {
  return await db.getConnection();
};

exports.create = async (
  data,
  connection = db
) => {

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

  const [result] = await connection.query(sql, [
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

  return result.insertId;
};

exports.insertOtherPatient = async (
  data,
  connection = db
) => {

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

  const [result] = await connection.query(sql, [
    data.appointment_id,
    data.user_id,
    data.name,
    data.age,
    data.gender,
    data.phone,
    data.email
  ]);

  return result.insertId;
};

exports.countTodayAppointments = async (
  patientId,
  appointmentDate,
  connection = db
) => {

  const [rows] = await connection.query(
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


exports.checkSlotBooked = async (
  doctorId,
  appointmentDate,
  startTime,
  connection = db
) => {

  const [rows] = await connection.query(
    `
    SELECT id
    FROM appointments
    WHERE doctor_id = ?
      AND slot_date = ?
      AND start_time = ?
      AND status != 'CANCELLED'
    LIMIT 1
    `,
    [
      doctorId,
      appointmentDate,
      startTime
    ]
  );

  return rows.length > 0;
};

exports.getNextTokenNumber = async (
  doctorId,
  appointmentDate,
  hospitalName,
  connection = db
) => {

  const [rows] = await connection.query(
    `
    SELECT COALESCE(MAX(token_number),0)+1 AS nextToken
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

exports.getAppointmentPublicById = async (
  patientId,
  connection = db
) => {

  const [rows] = await connection.query(
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

exports.getDashboardStats = async (
  doctorId,
  connection = db
) => {

  const [rows] = await connection.query(
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
          AND status = 'COMPLETED'
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
      AND is_deleted = 0
    `,
    [doctorId]
  );

  return rows[0];
};

// ===============================
// Doctor Appointment Table
// ===============================
exports.getDoctorAppointmentsForTable = async (
  doctorId,
  hospitalName,
  mode,
  slot_date,
  status,
  limit,
  offset,
  connection = db
) => {

  let query = `
    SELECT

      a.id AS appointment_id,

      a.token_number,

      COALESCE(u.full_name,'Unknown') AS name,

      COALESCE(
        u.phone_number,
        ap.patient_phone
      ) AS phone_number,

      d.specialization AS diagnostic,

      DATE_FORMAT(
        a.slot_date,
        '%d-%m-%Y'
      ) AS date,

      DATE_FORMAT(
        a.start_time,
        '%h:%i %p'
      ) AS time,

      a.appointment_type AS mode,

      COALESCE(
        a.hospital_name,
        'Online'
      ) AS hospital_name,

      a.status,

      DATE_FORMAT(
        a.created_at,
        '%d-%m-%Y %h:%i %p'
      ) AS booked_at

    FROM appointments a

    LEFT JOIN users u
      ON u.id = a.patient_id

    LEFT JOIN appointment_patients ap
      ON ap.appointment_id = a.id

    LEFT JOIN doctors d
      ON d.user_id = a.doctor_id

    WHERE a.doctor_id = ?
  `;

  const params = [doctorId];

  if (hospitalName) {
    query += `
      AND LOWER(TRIM(a.hospital_name))
          = LOWER(TRIM(?))
    `;
    params.push(hospitalName);
  }

  if (mode) {
    query += `
      AND LOWER(a.appointment_type)
          = LOWER(?)
    `;
    params.push(mode);
  }

  if (status) {
    query += `
      AND LOWER(a.status)
          = LOWER(?)
    `;
    params.push(status);
  } else {
    query += `
      AND LOWER(a.status)
      IN ('pending','in_progress')
    `;
  }

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
    LIMIT ?
    OFFSET ?
  `;

  params.push(
    Number(limit),
    Number(offset)
  );

  const [rows] =
    await connection.query(
      query,
      params
    );

  let countQuery = `
    SELECT COUNT(*) AS total
    FROM appointments a
    WHERE a.doctor_id = ?
  `;

  const countParams = [doctorId];

  if (hospitalName) {
    countQuery += `
      AND LOWER(TRIM(a.hospital_name))
          = LOWER(TRIM(?))
    `;
    countParams.push(hospitalName);
  }

  if (mode) {
    countQuery += `
      AND LOWER(a.appointment_type)
          = LOWER(?)
    `;
    countParams.push(mode);
  }

  if (status) {
    countQuery += `
      AND LOWER(a.status)
          = LOWER(?)
    `;
    countParams.push(status);
  } else {
    countQuery += `
      AND LOWER(a.status)
      IN ('pending','in_progress')
    `;
  }

  if (slot_date) {
    countQuery += `
      AND DATE(a.slot_date) = ?
    `;
    countParams.push(slot_date);
  }

  const [[countResult]] =
    await connection.query(
      countQuery,
      countParams
    );

  return {
    rows,
    total: countResult.total
  };
};

exports.getAppointmentForCancel = async (
  appointmentId,
  patientId,
  connection = db
) => {

  const [rows] = await connection.query(
    `
    SELECT
      id,
      doctor_id,
      patient_id,
      schedule_id,
      slot_date,
      start_time,
      end_time,
      status
    FROM appointments
    WHERE id = ?
      AND patient_id = ?
      AND is_deleted = 0
    LIMIT 1
    `,
    [
      appointmentId,
      patientId
    ]
  );

  return rows[0] || null;
};

exports.cancelAppointment = async (
  appointmentId,
  reason,
  connection = db
) => {

  const [result] =
    await connection.query(
      `
      UPDATE appointments
      SET
        status = 'CANCELLED',
        cancel_reason = ?,
        updated_at = NOW()
      WHERE id = ?
      `,
      [
        reason,
        appointmentId
      ]
    );

  return result.affectedRows;
};

// ===============================
// Auto Cancel Pending Appointments
// ===============================
exports.autoCancelPendingAppointments = async (
  connection = db
) => {

  const [result] =
    await connection.query(
      `
      UPDATE appointments
      SET
        status = 'CANCELLED',
        updated_at = NOW()
      WHERE status = 'PENDING'
        AND DATE(slot_date) < CURDATE()
      `
    );

  console.log(
    `Auto Cancelled Appointments: ${result.affectedRows}`
  );

  return result;
};

// ===============================
// Get Appointment By Doctor
// ===============================
exports.getAppointmentById = async (
  doctorId,
  connection = db
) => {

  const [rows] = await connection.query(
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
        SELECT
          user_id,
          MAX(id) AS max_id
        FROM user_profiles
        GROUP BY user_id
      ) latest
      ON up1.id = latest.max_id
    ) up
      ON up.user_id = u.id

    LEFT JOIN doctors d
      ON d.id = a.doctor_id

    WHERE a.doctor_id = ?
      AND a.is_deleted = 0

    ORDER BY a.id DESC
    `,
    [doctorId]
  );

  return rows;
};

// ===============================
// Count Today Appointments
// ===============================
exports.countTodayAppointments = async (
  patientId,
  appointmentDate,
  connection = db
) => {

  const [rows] = await connection.query(
    `
    SELECT
      COUNT(*) AS total
    FROM appointments
    WHERE patient_id = ?
      AND DATE(slot_date) = ?
      AND status <> 'CANCELLED'
      AND is_deleted = 0
    `,
    [
      patientId,
      appointmentDate
    ]
  );

  return Number(rows[0].total);
};

// ===============================
// Get Appointment By Patient
// ===============================
exports.getByIdAndPatient = async (
  patientId,
  connection = db
) => {

  const [rows] = await connection.query(
    `
    SELECT
      a.*
    FROM appointments a

    INNER JOIN appointment_patients ap
      ON ap.appointment_id = a.id

    WHERE ap.user_id = ?
      AND a.is_deleted = 0

    ORDER BY a.id DESC
    `,
    [patientId]
  );

  return rows;
};

// ===============================
// Get Appointment Details
// ===============================
exports.getAppointmentDetails = async (
  doctorId,
  appointmentId,
  connection = db
) => {

  const [rows] = await connection.query(
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
      a.reason_for_visit,
      a.status,

      u.id AS patient_id,

      COALESCE(
        u.full_name,
        ap.patient_name
      ) AS patient_name,

      COALESCE(
        u.phone_number,
        ap.patient_phone
      ) AS phone_number,

      COALESCE(
        u.email,
        ap.patient_email
      ) AS email,

      COALESCE(
        up.gender,
        ap.gender
      ) AS gender,

      COALESCE(
        up.age,
        ap.age
      ) AS age,

      up.weight,
      up.height,
      up.blood_group,
      up.language,
      up.existing_conditions,
      up.allergies,
      up.address,

      d.specialization

    FROM appointments a

    LEFT JOIN users u
      ON u.id = a.patient_id

    LEFT JOIN appointment_patients ap
      ON ap.appointment_id = a.id

    LEFT JOIN (
      SELECT up1.*
      FROM user_profiles up1
      INNER JOIN (
        SELECT
          user_id,
          MAX(id) AS max_id
        FROM user_profiles
        GROUP BY user_id
      ) latest
      ON up1.id = latest.max_id
    ) up
      ON up.user_id = u.id

    LEFT JOIN doctors d
      ON d.user_id = a.doctor_id

    WHERE a.doctor_id = ?
      AND a.id = ?
      AND a.is_deleted = 0

    LIMIT 1
    `,
    [
      doctorId,
      appointmentId
    ]
  );

  return rows[0] || null;
};


// ===============================
// Get All Patient Appointments
// ===============================
exports.getAllByPatient = async (
  userId,
  connection = db
) => {

  const [rows] = await connection.query(
    `
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

    WHERE
      (
        a.patient_id = ?
        OR ap.user_id = ?
      )
      AND a.is_deleted = 0

    ORDER BY
      a.slot_date DESC,
      a.start_time ASC
    `,
    [
      userId,
      userId
    ]
  );

  return rows;
};

// ===============================
// Get Today's Appointments
// ===============================
exports.getAppointments = async (
  {
    doctorId,
    limit,
    offset
  },
  connection = db
) => {

  const todayDate = new Date()
    .toLocaleDateString("en-CA", {
      timeZone: "Asia/Kolkata"
    });

  const query = `
    SELECT
      a.id AS appointment_id,

      a.token_number,

      DATE_FORMAT(
        a.slot_date,
        '%Y-%m-%d'
      ) AS slot_date,

      TIME_FORMAT(
        a.start_time,
        '%h:%i %p'
      ) AS start_time,

      TIME_FORMAT(
        a.end_time,
        '%h:%i %p'
      ) AS end_time,

      a.status,
      a.reason_for_visit,
      a.appointment_type,
      a.booking_type,
      a.hospital_name,

      u.id AS patient_id,

      COALESCE(
        u.full_name,
        ap.patient_name
      ) AS patient_name,

      COALESCE(
        u.phone_number,
        ap.patient_phone
      ) AS phone_number,

      COALESCE(
        u.email,
        ap.patient_email
      ) AS email,

      COALESCE(
        up.age,
        ap.age
      ) AS age,

      COALESCE(
        up.gender,
        ap.gender
      ) AS gender,

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

    LEFT JOIN (
      SELECT up1.*
      FROM user_profiles up1
      INNER JOIN (
        SELECT
          user_id,
          MAX(id) AS max_id
        FROM user_profiles
        GROUP BY user_id
      ) latest
      ON up1.id = latest.max_id
    ) up
      ON up.user_id = u.id

    WHERE
      a.doctor_id = ?
      AND DATE(a.slot_date) = ?
      AND a.is_deleted = 0

    ORDER BY
      a.start_time ASC,
      a.token_number ASC

    LIMIT ?
    OFFSET ?
  `;

  const [rows] =
    await connection.query(
      query,
      [
        doctorId,
        todayDate,
        Number(limit),
        Number(offset)
      ]
    );

  const [[count]] =
    await connection.query(
      `
      SELECT
        COUNT(*) AS total
      FROM appointments
      WHERE doctor_id = ?
        AND DATE(slot_date) = ?
        AND is_deleted = 0
      `,
      [
        doctorId,
        todayDate
      ]
    );

  return {
    rows,
    total: count.total
  };

};


exports.getDashboardCards = async (
  {
    doctorId
  },
  connection = db
) => {

  const [[row]] =
    await connection.query(
      `
      SELECT

        COUNT(*) AS total_appointment,

        SUM(
          CASE
            WHEN status = 'PENDING'
            THEN 1
            ELSE 0
          END
        ) AS total_upcoming,

        SUM(
          CASE
            WHEN status = 'COMPLETED'
            THEN 1
            ELSE 0
          END
        ) AS total_completed,

        SUM(
          CASE
            WHEN status = 'CANCELLED'
            THEN 1
            ELSE 0
          END
        ) AS total_cancelled

      FROM appointments

      WHERE doctor_id = ?
        AND is_deleted = 0
      `,
      [doctorId]
    );

  return row;
};

exports.getPatientDashboardCards = async (
  {
    doctorId,
    filter,
    mode
  },
  connection = db
) => {

  let dateCondition = "";

  switch (filter) {

    case "day":
      dateCondition =
        "DATE(slot_date) = CURDATE()";
      break;

    case "week":
      dateCondition =
        "YEARWEEK(slot_date,1)=YEARWEEK(CURDATE(),1)";
      break;

    case "month":
      dateCondition =
        "MONTH(slot_date)=MONTH(CURDATE()) AND YEAR(slot_date)=YEAR(CURDATE())";
      break;

    case "year":
      dateCondition =
        "YEAR(slot_date)=YEAR(CURDATE())";
      break;

    default:
      dateCondition =
        "DATE(slot_date)=CURDATE()";
  }

  const query = `
    SELECT

      COUNT(
        CASE
          WHEN appointment_type = ?
          AND ${dateCondition}
          THEN 1
        END
      ) AS patient,

      COUNT(
        CASE
          WHEN appointment_type = ?
          AND status='PENDING'
          AND ${dateCondition}
          THEN 1
        END
      ) AS pending,

      COUNT(
        CASE
          WHEN appointment_type = ?
          AND status='COMPLETED'
          AND ${dateCondition}
          THEN 1
        END
      ) AS completed,

      (
        SELECT COUNT(*)
        FROM appointments
        WHERE doctor_id=?
        AND status='COMPLETED'
        AND is_deleted=0
      ) AS total_patient

    FROM appointments

    WHERE doctor_id=?
      AND is_deleted=0
  `;

  const [[row]] =
    await connection.query(query, [
      mode,
      mode,
      mode,
      doctorId,
      doctorId
    ]);

  if (
    String(mode).toLowerCase() === "online"
  ) {

    return {

      online_patient: row.patient,

      online_pending: row.pending,

      online_complete: row.completed,

      total_patient: row.total_patient

    };

  }

  return {

    offline_patient: row.patient,

    offline_pending: row.pending,

    offline_complete: row.completed,

    total_patient: row.total_patient

  };

};

exports.checkUserSameSlot = async (
  patientId,
  date,
  timeSlot,
  connection = db
) => {

  const [start, end] =
    timeSlot
      .split(" - ")
      .map(parse12to24);

  const [rows] =
    await connection.query(
      `
      SELECT id
      FROM appointments
      WHERE patient_id = ?
      AND slot_date = ?
      AND start_time = ?
      AND end_time = ?
      AND status <> 'CANCELLED'
      LIMIT 1
      `,
      [
        patientId,
        date,
        start,
        end
      ]
    );

  return rows.length > 0;

};

exports.getNextTokenNumber = async (
  doctorId,
  appointmentDate,
  hospitalName,
  connection = db
) => {

  const [[row]] =
    await connection.query(
      `
      SELECT
      COALESCE(
        MAX(token_number),
        0
      ) + 1 AS nextToken

      FROM appointments

      WHERE doctor_id = ?
      AND DATE(slot_date)=?
      AND LOWER(TRIM(hospital_name))
          = LOWER(TRIM(?))
      `,
      [
        doctorId,
        appointmentDate,
        hospitalName
      ]
    );

  return row.nextToken;
};

exports.checkTokenExists = async (
  doctorId,
  appointmentDate,
  hospitalName,
  token,
  connection = db
) => {

  const [rows] = await connection.query(
    `
    SELECT id
    FROM appointments
    WHERE doctor_id = ?
      AND DATE(slot_date) = ?
      AND LOWER(TRIM(hospital_name)) = LOWER(TRIM(?))
      AND token_number = ?
    LIMIT 1
    `,
    [
      doctorId,
      appointmentDate,
      hospitalName,
      token
    ]
  );

  return rows.length > 0;
};