const db = require("../config/db");

function parseJSON(value) {
  if (!value) return [];

  try {
    return typeof value === "string" ? JSON.parse(value) : value;
  } catch {
    return [];
  }
}

async function findDoctors(filters = {}) {
  try {
    let sql = `
      SELECT
        d.id AS doctor_id,
        d.user_id,
        d.username,
        d.specialization,
        d.qualification AS education,
        d.experience,
        d.consultation_fee AS fee,
        d.language,
        d.age,
        d.gender,
        d.hospital_detail,

        u.id,
        u.full_name,
        u.email,
        u.phone_number,

        JSON_UNQUOTE(
          JSON_EXTRACT(d.hospital_detail,'$[0].hospitalName')
        ) AS hospital_name,

        (
          SELECT file_key
          FROM user_images
          WHERE user_id IN (d.id, d.user_id)
          ORDER BY id DESC
          LIMIT 1
        ) AS photo

      FROM doctors d
      LEFT JOIN users u
        ON u.id = d.user_id

      WHERE 1 = 1
    `;

    const params = [];

    if (filters.name?.trim()) {
      sql += " AND u.full_name LIKE ?";
      params.push(`%${filters.name.trim()}%`);
    }

    if (filters.email?.trim()) {
      sql += " AND u.email LIKE ?";
      params.push(`%${filters.email.trim()}%`);
    }

    if (filters.phone_number?.trim()) {
      sql += " AND u.phone_number LIKE ?";
      params.push(`%${filters.phone_number.trim()}%`);
    }

    if (filters.specialization?.trim()) {
      sql += " AND d.specialization LIKE ?";
      params.push(`%${filters.specialization.trim()}%`);
    }

    sql += " ORDER BY d.id DESC";

    const [rows] = await db.execute(sql, params);

    return rows.map((doctor) => ({
      id: doctor.doctor_id,
      doctorId: doctor.doctor_id,
      userId: doctor.user_id,

      fullName: doctor.full_name || null,
      email: doctor.email || null,
      phoneNumber: doctor.phone_number || null,

      username: doctor.username,
      gender: doctor.gender,
      age: doctor.age,

      specialization: doctor.specialization,
      education: doctor.education,
      experience: doctor.experience,
      consultationFee: doctor.fee,

      language: parseJSON(doctor.language),
      hospitalName: doctor.hospital_name,
      hospitalDetail: parseJSON(doctor.hospital_detail),

      photo: doctor.photo || null
    }));
  } catch (error) {
    console.error("findDoctors Error:", error);
    throw error;
  }
}

module.exports = {
  findDoctors
};