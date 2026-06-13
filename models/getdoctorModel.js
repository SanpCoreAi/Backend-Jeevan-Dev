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

  JSON_UNQUOTE(
    JSON_EXTRACT(d.hospital_detail, '$[0].hospitalName')
  ) AS hospital_name,

  di.file_key AS photo,

  (
    SELECT ROUND(AVG(f.rating), 1)
    FROM feedbacks f
    WHERE f.doctor_id = d.user_id
  ) AS avg_rating

FROM users u

LEFT JOIN doctors d 
  ON u.id = d.user_id

LEFT JOIN doctor_image di 
  ON di.doctor_id = u.id

WHERE u.role_id = 2
`;

    const params = [];


    // Name Filter
    if (filters.name) {
      sql += " AND u.full_name LIKE ?";
      params.push(`%${filters.name.trim()}%`);
    }


    // Email Filter
    if (filters.email) {
      sql += " AND u.email LIKE ?";
      params.push(`%${filters.email.trim()}%`);
    }


    // Phone Filter
    if (filters.phone_number) {
      sql += " AND u.phone_number LIKE ?";
      params.push(`%${filters.phone_number.trim()}%`);
    }


    sql += " ORDER BY u.created_at DESC";


    const [rows] = await db.query(sql, params);


    const BASE_FILE_URL = "http://localhost:4000/uploads";
    const S3_BASE_URL = process.env.AWS_S3_BUCKET_URL;


    return rows.map((row) => ({
      ...row,

      avg_rating: row.avg_rating
        ? Number(row.avg_rating)
        : 0,


      photo: row.photo
        ? (
            row.photo.startsWith("http") ||
            row.photo.startsWith("data:")
          )
          ? row.photo

          : S3_BASE_URL &&
            S3_BASE_URL !== "undefined"

          ? `${S3_BASE_URL}/${encodeURI(row.photo)}`

          : `${BASE_FILE_URL}/doctor-images/${encodeURI(row.photo)}`

        : null,
    }));


  } catch (err) {

    console.error("Database Error (findDoctors):", err);

    throw err;
  }
}

module.exports = {
  findDoctors
};