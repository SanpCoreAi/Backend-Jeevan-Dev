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



exports.insertMeta = async (id, remark, followUpDate, conn) => {
  await conn.execute(
    `UPDATE prescriptions 
     SET remark = ?, follow_up_date = ?
     WHERE appointment_id = ?`,
    [remark, followUpDate, id]
  );
};



// ✅ Updated query with prescriptions JOIN
exports.getAppointmentFullData = async (token_number) => {
  const [rows] = await db.query(`
    SELECT 
      a.id AS appointment_id,
      a.token_number,
      a.slot_date,
      a.start_time,
      a.end_time,
      a.status,
      a.hospital_name,

      u_doc.id AS doctor_id,
      u_doc.full_name AS doctor_name,
      u_doc.phone_number AS doctor_mobile,

      d.specialization,
      d.qualification,
      d.medical_license_no,
      d.qr_code,
      d.hospital_detail,
      d.availability,

      u_pat.id AS patient_id,
      u_pat.full_name AS patient_name,

      up.age,
      up.gender,
      up.height,
      up.weight

    FROM appointments a
    LEFT JOIN users u_doc ON a.doctor_id = u_doc.id
    LEFT JOIN doctors d ON u_doc.id = d.user_id
    LEFT JOIN users u_pat ON a.patient_id = u_pat.id
    LEFT JOIN user_profiles up ON u_pat.id = up.user_id

    WHERE a.token_number = ?
    LIMIT 1;
  `, [token_number]);

  return rows[0];
};


exports.getPrescriptionMedicines = async (appointment_id) => {
  const [rows] = await db.query(`
    SELECT 
      id,
      medicine_name,
      dose,
      frequency,
      duration,
      instructions,
      remark,
      follow_up_date,
      created_at
    FROM prescriptions   -- ✅ apna actual table naam yahan lagao
    WHERE appointment_id = ?
  `, [appointment_id]);

  return rows;
};