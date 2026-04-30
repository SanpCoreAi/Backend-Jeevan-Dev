const db = require("../config/db");

exports.getByAppointment = async (id, db) => {
  const [rows] = await db.execute(
    `SELECT * FROM prescriptions WHERE appointment_id=?`,
    [id]
  );
  return rows;
};

exports.deleteByAppointment = async (id, conn) => {
  await conn.execute(
    `DELETE FROM prescriptions WHERE appointment_id=?`,
    [id]
  );
};

exports.insert = async (id, med, conn) => {
  await conn.execute(
    `INSERT INTO prescriptions 
     (appointment_id, medicine_name, dose, frequency, duration, instructions)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      id,
      med.medicine_name,
      med.dose,
      med.frequency,
      med.duration,
      med.instructions
    ]
  );
};