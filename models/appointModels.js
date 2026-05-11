const db = require("../config/db");

exports.getByToken = async (token) => {
  
const [rows] = await db.execute(
  `SELECT 
    a.id AS appointment_id,
    a.token_number,
    a.status,
    u.full_name AS patient_name
   FROM appointments a
   LEFT JOIN users u ON a.patient_id = u.id
   WHERE a.token_number = ?
   LIMIT 1`,
  [token]
);


  return rows[0];
};

exports.getById = async (id) => {
  const [rows] = await db.execute(
    `SELECT * FROM appointments WHERE id=?`,
    [id]
  );
  return rows[0];
};

exports.start = async (id) => {
  await db.execute(
    `UPDATE appointments 
     SET status = 'IN_PROGRESS'
     WHERE id = ?`,
    [id]
  );
};

exports.complete = async (id) => {
  await db.execute(
    `UPDATE appointments 
     SET status='COMPLETED', completed_at=NOW() 
     WHERE id=?`,
    [id]
  );
};

exports.revisit = async (patientId, doctorId) => {
  const [rows] = await db.execute(
    `SELECT * FROM appointments 
     WHERE patient_id=? AND doctor_id=? 
     ORDER BY created_at DESC LIMIT 1`,
    [patientId, doctorId]
  );
  return rows[0];
};