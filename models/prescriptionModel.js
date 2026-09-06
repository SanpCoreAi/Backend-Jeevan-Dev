const db = require("../config/db");


exports.getByAppointment = async (
  id,
  conn = db
) => {

  const [rows] = await conn.execute(
    `
    SELECT *
    FROM prescriptions
    WHERE appointment_id = ?
    ORDER BY id ASC
    `,
    [id]
  );


  return rows;
};

exports.deleteByAppointment = async (id, conn = db) => {
  await conn.execute(
    `
      DELETE FROM prescriptions
      WHERE appointment_id = ?
    `,
    [id]
  );
};



exports.insert = async (
  id,
  med,
  remark,
  followUpDate,
  diagnosis,
  conn = db
) => {

  await conn.execute(
    `
    INSERT INTO prescriptions
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
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    [
      id,
      med.medicine_name ?? null,
      med.dose ?? null,
      med.frequency ?? null,
      med.duration ?? null,
      med.instructions ?? null,
      remark ?? null,
      followUpDate ?? null,
      diagnosis ?? null
    ]
  );
};

exports.getPrescriptionMedicines = async (
  appointment_id
) => {
  const [rows] = await db.execute(
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

exports.getAppointmentFullDataById = async (
  appointment_id
) => {

  const [rows] = await db.execute(
    `
    SELECT

      /* ================= APPOINTMENT ================= */

      a.id AS appointment_id,
      a.token_number,
      a.slot_date,
      a.start_time,
      a.end_time,
      a.status,
      a.hospital_name,


      /* ================= DOCTOR ================= */

      doc.id AS doctor_id,
      doc.full_name AS doctor_name,
      doc.phone_number AS doctor_mobile,


      d.specialization,
      d.qualification,
      d.medical_license_no,
      d.qr_url,
      d.hospital_detail,
      d.availability,


      /* ================= PATIENT ================= */

      pat.id AS patient_id,
      pat.full_name AS patient_name,


      up.age,
      up.gender,
      up.height,
      up.weight


    FROM appointments a


    LEFT JOIN users doc
      ON a.doctor_id = doc.id


    LEFT JOIN doctors d
      ON doc.id = d.user_id


    LEFT JOIN users pat
      ON a.patient_id = pat.id


    LEFT JOIN user_profiles up
      ON pat.id = up.user_id


    WHERE a.id = ?

    LIMIT 1
    `,
    [
      appointment_id
    ]
  );


  return rows[0] || null;
};