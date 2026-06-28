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
      a.token_number,
      a.status
    FROM appointments a
    WHERE a.id = ?
      AND a.token_number = ?
      AND a.doctor_id = ?
    `,
    [appointmentId, token, doctorId]
  );

  console.log(rows);

  return rows[0];
};

exports.getById = async (id) => {

  const [rows] = await db.execute(
    `SELECT * FROM appointments WHERE id = ?`,
    [id]
  );

  return rows[0];
};


exports.start = async (id) => {

  const [result] = await db.execute(
    `UPDATE appointments
     SET status = 'IN_PROGRESS'
     WHERE id = ?`,
    [id]
  );

  return result;
};


exports.complete = async (id) => {

  const [result] = await db.execute(
    `UPDATE appointments
     SET 
       status = 'COMPLETED',
       created_at = NOW()

     WHERE id = ?`,
    [id]
  );

  return result;
};


exports.revisit = async (patientId, doctorId) => {

  const [rows] = await db.execute(
    `SELECT * FROM appointments
     WHERE patient_id = ?
     AND doctor_id = ?

     ORDER BY created_at DESC
     LIMIT 1`,
    [patientId, doctorId]
  );

  return rows[0];
};