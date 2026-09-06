const db = require("../config/db");

exports.getByAppointmentIdAndCode = async ({
  doctorId,
  appointmentId,
  code
}) => {

  const [rows] = await db.execute(
    `
    SELECT
      a.id AS appointment_id,
      a.doctor_id,
      a.patient_id,
      a.code,
      a.token_number,
      a.status,
      a.appointment_type,
      a.booking_type
    FROM appointments a
    WHERE a.id = ?
      AND a.code = ?
      AND a.doctor_id = ?
    `,
    [
      appointmentId,
      code,
      doctorId
    ]
  );

  return rows[0] || null;
};

exports.getAppointmentsByDate = async (
  scheduleId,
  date,
  connection = db
) => {

  const [rows] = await connection.query(
    `
    SELECT
      a.id,
      a.schedule_id,
      a.patient_id,
      a.slot_date,
      a.start_time,
      a.end_time,
      u.full_name AS patient_name,
      u.email
    FROM appointments a
    LEFT JOIN users u
      ON u.id = a.patient_id
    WHERE a.schedule_id = ?
      AND DATE(a.slot_date) = DATE(?)
      AND a.status <> 'CANCELLED'
    `,
    [
      scheduleId,
      date
    ]
  );

  return rows;
};

exports.getById = async (id) => {

  const [rows] = await db.execute(
    `
    SELECT *
    FROM appointments
    WHERE id = ?
    `,
    [id]
  );

  return rows[0] || null;
};

exports.start = async (id) => {
  const [result] = await db.execute(
    `
    UPDATE appointments
    SET
      status = 'IN_PROGRESS'
    WHERE id = ?
      AND status = 'PENDING'
    `,
    [id]
  );

  return result;
};

exports.complete = async (id) => {

  const [result] = await db.execute(
    `
    UPDATE appointments
    SET 
      status = 'COMPLETED',
      completed_at = NOW()
    WHERE id = ?
      AND status = 'IN_PROGRESS'
    `,
    [id]
  );

  return result;
};

exports.revisit = async (
  patientId,
  doctorId
) => {

  const [rows] = await db.execute(
    `
    SELECT *
    FROM appointments
    WHERE patient_id = ?
      AND doctor_id = ?
      AND status = 'COMPLETED'
    ORDER BY created_at DESC
    LIMIT 1
    `,
    [
      patientId,
      doctorId
    ]
  );


  return rows[0] || null;
};

exports.getAppointmentsBySchedule = async (
  scheduleId,
  connection = db
) => {

  console.log("Schedule ID:", scheduleId);

  const [rows] = await connection.query(
    `
    SELECT
      a.id,
      a.schedule_id,
      a.patient_id,
      a.slot_date,
      a.start_time,
      a.end_time,
      u.full_name AS patient_name,
      u.email
    FROM appointments a
    LEFT JOIN users u
      ON u.id = a.patient_id
    WHERE a.schedule_id = ?
      AND a.status <> 'CANCELLED'
    `,
    [scheduleId]
  );

  return rows;
};

exports.getAppointmentBySlot = async (
  scheduleId,
  startDate,
  startTime,
  connection = db
) => {

  const [rows] = await connection.query(
    `
    SELECT
      a.id,
      a.schedule_id,
      a.patient_id,
      a.slot_date,
      a.start_time,
      a.end_time,
      u.full_name AS patient_name,
      u.email
    FROM appointments a
    LEFT JOIN users u
      ON u.id = a.patient_id
    WHERE a.schedule_id = ?
      AND DATE(a.slot_date) = DATE(?)
      AND a.start_time = ?
      AND a.status <> 'CANCELLED'
    LIMIT 1
    `,
    [
      scheduleId,
      startDate,
      startTime
    ]
  );

  return rows.length ? rows[0] : null;
};


exports.makeSlotsInactiveByDate = async (
  { doctorId, scheduleId, date },
  connection = db
) => {
  const [result] = await connection.query(
    `
    UPDATE schedule_slots
    SET status = 'INACTIVE'
    WHERE doctor_id = ?
      AND schedule_id = ?
      AND DATE(start_date) = DATE(?)
    `,
    [
      doctorId,
      scheduleId,
      date
    ]
  );

  return result;
};

exports.cancelAppointment = async (
  appointmentId,
  reason,
  connection = db
) => {

  const [result] = await connection.query(
    `
    UPDATE appointments
    SET
      status = 'CANCELLED',
      doctor_reason = ?,
      updated_at = NOW()
    WHERE id = ?
    `,
    [
      reason,
      appointmentId
    ]
  );

  return result;
};