const db = require("../config/db");

exports.getByAppointmentId = async ({
  doctorId,
  appointmentId
}) => {

  const [rows] = await db.execute(
    `
    SELECT
      a.id AS appointment_id,
      a.doctor_id,
      a.patient_id,
      a.token_number,
      a.status,
      a.appointment_type,
      a.booking_type
    FROM appointments a
    WHERE a.id = ?
      AND a.doctor_id = ?
    `,
    [
      appointmentId,
      doctorId
    ]
  );

  return rows[0] || null;
};

exports.getAppointmentsByDate = async (
  scheduleId,
  slotDate,
  connection = db
) => {

  const [rows] = await connection.query(
    `
    SELECT
      a.id,
      a.slot_date,
      a.start_time,
      a.end_time,
      COALESCE(u.full_name, ap.patient_name) AS patient_name,
      COALESCE(u.email, ap.patient_email) AS email
    FROM appointments a

    LEFT JOIN users u
      ON u.id = a.patient_id

    LEFT JOIN appointment_patients ap
      ON ap.appointment_id = a.id

    WHERE a.schedule_id = ?
      AND DATE(a.slot_date)=?
      AND a.status <> 'CANCELLED'
    `,
    [
      scheduleId,
      slotDate
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

  console.log("Appointments:", rows);

  return rows;
};

exports.getAppointmentBySlot = async (
  scheduleId,
  slotDate,
  startTime,
  connection = db
) => {

  const [rows] = await connection.query(
    `
    SELECT
      a.id,
      a.slot_date,
      a.start_time,
      a.end_time,
      COALESCE(u.full_name, ap.patient_name) AS patient_name,
      COALESCE(u.email, ap.patient_email) AS email
    FROM appointments a

    LEFT JOIN users u
      ON u.id = a.patient_id

    LEFT JOIN appointment_patients ap
      ON ap.appointment_id = a.id

    WHERE a.schedule_id = ?
      AND DATE(a.slot_date) = DATE(?)
      AND TIME(a.start_time) = TIME(?)
      AND a.status <> 'CANCELLED'
    LIMIT 1
    `,
    [
      scheduleId,
      slotDate,
      startTime
    ]
  );

  console.log("Appointment By Slot:", rows);

  return rows[0] || null;
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