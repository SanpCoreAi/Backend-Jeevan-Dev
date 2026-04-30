const db = require("../config/db");

exports.getByToken = async (token) => {
  const [rows] = await db.execute(
    `SELECT 
      a.id, 
      a.token_number, 
      a.status, 
      a.appointment_type,

      a.patient_id, 
      u.full_name AS patient_name, 
      up.age, 
      up.gender,   

      d.id AS doctor_id, 
      d.username AS doctor_name, 
      d.specialization

     FROM appointments a
     JOIN users u ON a.patient_id = u.id
     LEFT JOIN user_profiles up ON a.patient_id = up.user_id
     JOIN doctors d ON a.doctor_id = d.id
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
     SET 
       status = 'IN_PROGRESS',
       status = status + 1
     WHERE id = ?`,
    [id]
  );
};

exports.complete = async (id) => {
  await db.execute(
    `UPDATE appointments SET status='COMPLETED' WHERE id=?`,
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