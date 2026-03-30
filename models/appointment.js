const db = require("../config/db");

exports.create = async (data) => {
  const sql = `
    INSERT INTO appointments
    (token_number, slot_date, start_time, end_time, patient_id,
     doctor_id, schedule_id, appointment_type, booking_type)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
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
    data.booking_type
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


exports.getDoctorAppointmentsForTable = async (doctorId) => {
  const [rows] = await db.query(
    `
SELECT 
  COALESCE(u.full_name, 'Unknown') AS name,
  d.specialization AS diagnostic,
  DATE_FORMAT(a.slot_date, '%d-%m-%Y') AS date,
  a.token_number AS appointment_id,
  a.appointment_type AS mode,
  'Pending' AS status

FROM appointments a

LEFT JOIN users u ON u.id = a.patient_id
LEFT JOIN doctors d ON d.user_id = a.doctor_id   -- ✅ FIX HERE

WHERE a.doctor_id = ?

ORDER BY a.slot_date DESC, a.token_number ASC
    `,
    [doctorId]
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

  const [rows] = await db.query(
    `
    SELECT a.*
    FROM appointments a
    JOIN appointment_patients ap 
      ON ap.appointment_id = a.id
    WHERE ap.user_id = ?
    ORDER BY a.slot_date DESC
    `,
    [patientId]
  );

  return rows;
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