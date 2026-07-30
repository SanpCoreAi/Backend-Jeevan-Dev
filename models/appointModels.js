const db = require("../config/db");


exports.getByToken = async ({
  doctorId,
  appointmentId,
  token,
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
      AND a.token_number = ?
      AND a.doctor_id = ?
    `,
    [
      appointmentId,
      token,
      doctorId
    ]
  );


  return rows[0] || null;
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
      status = 'IN_PROGRESS',
      started_at = NOW()
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