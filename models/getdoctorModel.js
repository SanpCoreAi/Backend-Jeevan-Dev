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
        u.id,
        u.full_name,
        u.email,
        u.phone_number,

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

        JSON_UNQUOTE(
          JSON_EXTRACT(d.hospital_detail,'$[0].hospitalName')
        ) AS hospital_name,

        (
          SELECT file_key
          FROM doctor_image
          WHERE doctor_id IN (d.id,d.user_id)
          ORDER BY id DESC
          LIMIT 1
        ) AS photo,

        IFNULL(drs.avg_rating,0) AS avg_rating,
        IFNULL(drs.total_feedbacks,0) AS total_feedbacks

      FROM users u

      INNER JOIN doctors d
        ON d.user_id=u.id

      LEFT JOIN doctor_rating_summary drs
      ON drs.doctor_id = d.user_id

      WHERE u.role_id=2
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

    sql += `
      ORDER BY u.created_at DESC
    `;

    const [rows] = await db.execute(sql, params);

   return rows.map((doctor) => ({              // users.id
  id: doctor.doctor_id,  // doctors.id
  doctorId: doctor.id, 
  fullName: doctor.full_name,
  email: doctor.email,
  phoneNumber: doctor.phone_number,

  username:doctor.username,
  gender: doctor.gender,
  age: doctor.age,

  specialization: doctor.specialization,
  education: doctor.education,
  experience: doctor.experience,
  consultationFee: doctor.fee,

  language: parseJSON(doctor.language),
  hospitalName: doctor.hospital_name,
  hospitalDetail: parseJSON(doctor.hospital_detail),

  photo: doctor.photo || null,

  avgRating: Number(doctor.avg_rating),
  totalFeedbacks: Number(doctor.total_feedbacks)
}));
  } catch (error) {
    console.error("findDoctors Error:", error);
    throw error;
  }
}

module.exports = {
  findDoctors
};