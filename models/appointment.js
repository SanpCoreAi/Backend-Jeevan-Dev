const db = require("../config/db");

exports.create = async (data) => {

  const sql = `
    INSERT INTO appointments
    (token_number, slot_date, start_time, end_time,
     patient_id, doctor_id, schedule_id,
     appointment_type, booking_type, hospital_name)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
    data.hospital_name 
  ]);

  return res.insertId;
};

exports.insertOtherPatient = async (data) => {
  const sql = `
    INSERT INTO appointment_patients
    (appointment_id, user_id, patient_name, age, gender, patient_phone, patient_email)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `;

  await db.query(sql, [
    data.appointment_id,
    data.user_id,
    data.name,
    data.age,
    data.gender,
    data.phone,
    data.email
  ]);
};

exports.getAppointmentPublicById = async ( patientId) => {
  const [rows] = await db.query(
    `
    SELECT a.*
    FROM appointments a
    JOIN appointment_patients ap ON ap.appointment_id = a.id
    WHERE ap.user_id = ?
    `,
    [patientId]
  );

  return rows[0];
};

exports.getDoctorAppointmentsForTable = async (
  doctorId,
  hospitalName,
  limit,
  offset
) => {

  const [rows] = await db.query(
    `
    SELECT 
      COALESCE(u.full_name, 'Unknown') AS name,

      u.phone_number,

      d.specialization AS diagnostic,

      DATE_FORMAT(a.slot_date, '%d-%m-%Y') AS date,

      a.id AS appointment_id,

      a.token_number,

      a.appointment_type AS mode,

      COALESCE(a.hospital_name, 'Online') AS hospital_name,

      a.status,

      DATE_FORMAT(a.created_at, '%d-%m-%Y %h:%i %p')
        AS booked_at

    FROM appointments a

    LEFT JOIN users u
      ON u.id = a.patient_id

    LEFT JOIN doctors d
      ON d.id = a.doctor_id

    WHERE a.doctor_id = ?

    AND (
      LOWER(TRIM(COALESCE(a.hospital_name, '')))
        = LOWER(TRIM(?))

      OR a.hospital_name IS NULL
    )

    ORDER BY 
      a.slot_date DESC,
      a.start_time ASC,
      a.token_number ASC

    LIMIT ? OFFSET ?
    `,
    [
      doctorId,
      hospitalName,
      Number(limit),
      Number(offset)
    ]
  );

  // Total Count Query
  const [[countResult]] = await db.query(
    `
    SELECT COUNT(*) AS total

    FROM appointments a

    WHERE a.doctor_id = ?

    AND (
      LOWER(TRIM(COALESCE(a.hospital_name, '')))
        = LOWER(TRIM(?))

      OR a.hospital_name IS NULL
    )
    `,
    [
      doctorId,
      hospitalName
    ]
  );

  return {
    rows,
    total: countResult.total
  };
};


exports.getAppointmentById = async (doctorId, appointmentId) => {
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
    LEFT JOIN users u ON u.id = a.patient_id
    LEFT JOIN user_profiles up ON up.user_id = u.id
    LEFT JOIN doctors d ON d.id = a.doctor_id

    WHERE a.doctor_id = ?
    AND a.id = ?
    `,
    [doctorId, appointmentId]
  );

  return rows;
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

exports.getAllByPatient = async (patientId) => {

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
    ORDER BY a.slot_date DESC
  `, [patientId]);

  return rows.map(row => {

    return {
      ...row,

    };
  });
};

exports.getTodayAppointments = async (
  doctorId,
  todayDate,
  limit,
  offset
) => {

  console.log({
    doctorId,
    todayDate
  });

  const [rows] = await db.query(
    `
    SELECT

      COALESCE(u.full_name, 'Unknown')
        AS patient_name,

      DATE_FORMAT(a.slot_date, '%d-%m-%Y')
        AS appointment_date,

      TIME_FORMAT(a.start_time, '%h:%i %p')
        AS start_time,

      a.status

    FROM appointments a

    LEFT JOIN users u
      ON u.id = a.patient_id

    WHERE a.doctor_id = ?

    AND DATE(a.created_at) = ?

    ORDER BY a.created_at DESC

    LIMIT ? OFFSET ?
    `,
    [
      doctorId,
      todayDate,
      Number(limit),
      Number(offset)
    ]
  );

  const [[countResult]] = await db.query(
    `
    SELECT COUNT(*) AS total

    FROM appointments a

    WHERE a.doctor_id = ?

    AND DATE(a.created_at) = ?
    `,
    [
      doctorId,
      todayDate
    ]
  );

  return {
    rows,
    total: countResult.total
  };
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