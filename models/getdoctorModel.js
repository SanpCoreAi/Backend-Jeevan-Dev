const db = require("../config/db");

async function findDoctors(filters = {}) {
  try {
    let sql = `
SELECT 
  u.id,
  u.full_name,
  u.email,
  u.phone_number,

  d.id AS doctor_id,
  d.specialization,
  d.qualification AS education,
  d.experience,
  d.consultation_fee AS fee,
  d.language,
  d.bio,

  JSON_UNQUOTE(JSON_EXTRACT(d.hospital_detail, '$[0].hospitalName')) AS hospital_name,

  di.file_key AS photo

FROM users u
LEFT JOIN doctors d ON u.id = d.user_id
LEFT JOIN doctor_image di ON di.doctor_id = u.id

WHERE u.role_id = 2
`;

    const params = [];

    if (filters.name) {
      sql += " AND u.full_name LIKE ?";
      params.push(`%${filters.name.trim()}%`);
    }

    if (filters.email) {
      sql += " AND u.email LIKE ?";
      params.push(`%${filters.email}%`);
    }

    if (filters.phone_number) {
      sql += " AND u.phone_number LIKE ?";
      params.push(`%${filters.phone_number}%`);
    }

    // ✅ Only ONE ORDER BY at end
    sql += " ORDER BY u.created_at DESC";

    const [rows] = await db.query(sql, params);
    return rows;

  } catch (err) {
    console.error("Database Error (findDoctors):", err);
    throw err;
  }
}

module.exports = { findDoctors };