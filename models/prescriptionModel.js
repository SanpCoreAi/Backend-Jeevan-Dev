const db = require("../config/db");

exports.getByAppointment = async (id, conn = db) => {
  const [rows] = await conn.execute(
    `SELECT * FROM prescriptions WHERE appointment_id = ?`,
    [id]
  );

  return rows;
};

exports.deleteByAppointment = async (id, conn) => {
  await conn.execute(
    `DELETE FROM prescriptions WHERE appointment_id = ?`,
    [id]
  );
};

exports.insert = async (
  id,
  med,
  remark,
  followUpDate,
  diagnosis,
  conn
) => {
  await conn.execute(
    `INSERT INTO prescriptions 
    (
      appointment_id,
      medicine_name,
      dose,
      frequency,
      duration,
      instructions,
      remark,
      follow_up_date,
      diagnosis
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      med.medicine_name,
      med.dose,
      med.frequency,
      med.duration,
      med.instructions,
      remark || null,
      followUpDate || null,
      diagnosis || null
    ]
  );
};

exports.insertMeta = async (
  id,
  remark,
  followUpDate,
  diagnosis,
  conn
) => {
  await conn.execute(
    `UPDATE prescriptions 
     SET 
       remark = ?, 
       follow_up_date = ?, 
       diagnosis = ?
     WHERE appointment_id = ?`,
    [
      remark || null,
      followUpDate || null,
      diagnosis || null,
      id
    ]
  );
};

exports.getAppointmentFullDataById = async (appointment_id) => {
  const [rows] = await db.query(
    `
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

    LEFT JOIN users u_doc 
      ON a.doctor_id = u_doc.id

    LEFT JOIN doctors d 
      ON u_doc.id = d.user_id

    LEFT JOIN users u_pat 
      ON a.patient_id = u_pat.id

    LEFT JOIN user_profiles up 
      ON u_pat.id = up.user_id

    WHERE a.id = ?
    LIMIT 1
  `,
    [appointment_id]
  );

  return rows[0];
};

exports.getPrescriptionMedicines = async (appointment_id) => {
  const [rows] = await db.query(
    `
    SELECT 
      id,
      medicine_name,
      dose,
      frequency,
      duration,
      instructions,
      remark,
      diagnosis,
      follow_up_date,
      created_at,
      updated_at

    FROM prescriptions

    WHERE appointment_id = ?

    ORDER BY id ASC
  `,
    [appointment_id]
  );

  return rows;
};