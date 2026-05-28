const db = require("../config/db");


// =========================
// CREATE LIKE
// =========================
const createLike = async (userId, doctorId) => {

  const sql = `
    INSERT INTO likes (
      user_id,
      doctor_id
    )
    VALUES (?, ?)
  `;

  return db.execute(sql, [userId, doctorId]);
};


// =========================
// FIND LIKE
// =========================
const findLike = async (userId, doctorId) => {

  const sql = `
    SELECT id
    FROM likes
    WHERE user_id = ?
    AND doctor_id = ?
  `;

  const [rows] = await db.execute(
    sql,
    [userId, doctorId]
  );

  return rows;
};


// =========================
// DELETE LIKE
// =========================
const deleteLike = async (userId, doctorId) => {

  const sql = `
    DELETE FROM likes
    WHERE user_id = ?
    AND doctor_id = ?
  `;

  return db.execute(sql, [userId, doctorId]);
};


// =========================
// GET LIKED DOCTORS
// =========================
const getLikedDoctors = async (
  userId,
  limit,
  offset
) => {

  limit = Number(limit);
  offset = Number(offset);

  const sql = `
    SELECT 
      l.id,
      l.user_id,
      l.doctor_id,

      u.full_name AS username,

      d.specialization,
      d.qualification AS education,
      d.experience,
      d.consultation_fee AS fee,

      (
        SELECT ROUND(AVG(f.rating), 1)
        FROM feedbacks f
        WHERE f.doctor_id = d.user_id
      ) AS avg_rating,

      di.file_key AS profile_image,

      JSON_UNQUOTE(
        JSON_EXTRACT(
          d.hospital_detail,
          '$[0].hospitalName'
        )
      ) AS hospital_name

    FROM likes l

    INNER JOIN doctors d
      ON d.user_id = l.doctor_id

    INNER JOIN users u
      ON u.id = d.user_id

    LEFT JOIN doctor_image di
      ON di.doctor_id = d.user_id

    WHERE l.user_id = ?

    ORDER BY l.id DESC

    LIMIT ${limit}
    OFFSET ${offset}
  `;

  const [rows] = await db.execute(
    sql,
    [userId]
  );

  const BASE_FILE_URL =
    "http://localhost:4000/uploads";

  const S3_BASE_URL =
    process.env.AWS_S3_BUCKET_URL;

  return rows.map((row) => ({

    ...row,

    avg_rating: row.avg_rating
      ? Number(row.avg_rating)
      : 0,

    profile_image: row.profile_image

      ? (
          row.profile_image.startsWith("http") ||
          row.profile_image.startsWith("data:")
        )

        ? row.profile_image

        : S3_BASE_URL &&
          S3_BASE_URL !== "undefined"

        ? `${S3_BASE_URL}/${encodeURI(
            row.profile_image
          )}`

        : `${BASE_FILE_URL}/doctor-images/${encodeURI(
            row.profile_image
          )}`

      : null,
  }));
};


// =========================
// COUNT LIKED DOCTORS
// =========================
const countLikedDoctors = async (userId) => {

  const sql = `
    SELECT COUNT(*) AS total
    FROM likes
    WHERE user_id = ?
  `;

  const [rows] = await db.execute(
    sql,
    [userId]
  );

  return rows[0].total;
};


// =========================
// FIND USER BY TOKEN
// =========================
const findUserByToken = async (token) => {

  try {

    const sql = `
      SELECT 
        u.id,
        u.full_name,
        u.email,
        u.phone_number

      FROM appointments a

      JOIN users u
        ON a.patient_id = u.id

      WHERE a.token_number = ?

      LIMIT 1
    `;

    const [rows] = await db.execute(
      sql,
      [token]
    );

    if (rows.length === 0) {
      return null;
    }

    return rows[0];

  } catch (error) {

    console.error(
      "Model DB Error:",
      error
    );

    throw error;
  }
};


module.exports = {
  createLike,
  findLike,
  deleteLike,
  getLikedDoctors,
  countLikedDoctors,
  findUserByToken
};