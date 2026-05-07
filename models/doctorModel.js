const db = require("../config/db");
const createDoctor = async (params) => {
  const sql = `
    INSERT INTO doctors
    (user_id, username, specialization, qualification, experience, language,
     consultation_fee, medical_license_no, bio, availability, hospital_detail)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  const [result] = await db.execute(sql, params);
  return result.insertId;
};

const getByUserId = async (userId) => {
const sql = `
     SELECT
      d.*, d.qr_code,
      u.full_name AS user_full_name,
      u.email AS user_email,
      u.phone_number AS user_phone_number,
      COALESCE((
        SELECT JSON_ARRAYAGG(
          JSON_OBJECT(
            'id', di.id,
            'fileKey', di.file_key,
            'folder', di.folder_name,
            'createdAt', di.created_at
          )
        )
        FROM doctor_image di
        WHERE di.doctor_id = d.user_id
      ), JSON_ARRAY()) AS images,
      COALESCE((
        SELECT JSON_ARRAYAGG(
          JSON_OBJECT(
            'id', df.id,
            'fileKey', df.file_key,
            'folder', df.folder_name,
            'createdAt', df.created_at
          )
        )
        FROM doctor_files df
        WHERE df.doctor_id = d.user_id
      ), JSON_ARRAY()) AS files,
      IFNULL((
        SELECT AVG(f.rating)
        FROM feedbacks f
        WHERE f.doctor_id = d.id
      ),0) AS avg_rating
    FROM doctors d
    LEFT JOIN users u ON u.id = d.user_id
    WHERE d.user_id = ?
    LIMIT 1
  `;

  const [rows] = await db.execute(sql, [userId]);
  return rows[0] || null;
};

const getBydoctorId = async (userId) => {

  const sql = `
    SELECT
      d.id,
      d.user_id,
      d.username,
      d.specialization,
      d.qualification,
      d.experience,
      d.consultation_fee,
      d.medical_license_no,
      d.bio,
      d.language,
      d.availability,
      d.hospital_detail,
      d.qr_code,

      u.full_name AS user_full_name,
      u.email AS user_email,
      u.phone_number AS user_phone_number,

      -- ✅ Single image key
      (
        SELECT di.file_key
        FROM doctor_image di
        WHERE di.doctor_id = d.user_id
        AND di.file_key IS NOT NULL
        LIMIT 1
      ) AS image_key,

      IFNULL(
        (
          SELECT AVG(f.rating)
          FROM feedbacks f
          WHERE f.doctor_id = d.id
        ),
        0
      ) AS avg_rating

    FROM doctors d
    LEFT JOIN users u ON u.id = d.user_id
    WHERE d.user_id = ?
    LIMIT 1
  `;

  const [rows] = await db.execute(sql, [userId]);

  return rows[0] || null;
};

const updateDoctorQr = async (doctorId, qrCode) => {

  const sql = `
    UPDATE doctors
    SET qr_code = ?
    WHERE id = ?
  `;

  await db.execute(sql, [qrCode, doctorId]);
};

const getDoctorPublicProfileById = async (doctorId) => {

  const sql = `
    SELECT
      d.id,
      d.user_id,
      d.username,
      d.specialization,
      d.qualification,
      d.experience,
      d.consultation_fee,
      d.bio,
      d.language,
      d.availability,
      d.hospital_detail,

      u.full_name AS user_full_name,
      u.email AS user_email,
      u.phone_number AS user_phone_number,

      IFNULL(
        (
          SELECT AVG(f.rating)
          FROM feedbacks f
          WHERE f.doctor_id = d.id
        ),
        0
      ) AS avg_rating

    FROM doctors d
    LEFT JOIN users u ON u.id = d.user_id
    WHERE u.id = ?   -- ✅ recommended
    LIMIT 1
  `;

  const [rows] = await db.execute(sql, [doctorId]);

  return rows[0] || null;
};

const updateDoctor = async (params) => {
  const sql = `
    UPDATE doctors SET
      username = ?,
      specialization = ?,
      qualification = ?,
      experience = ?,
      language = ?,
      consultation_fee = ?,
      medical_license_no = ?,
      bio = ?,
      availability = ?,
      hospital_detail = ?
    WHERE user_id = ?
  `;

  await db.execute(sql, params);
};


/* ================= GET ALL DOCTORS (WITH USER + RATING) ================= */
const getAllDoctors = async () => {
  const sql = `
    SELECT
      d.id AS doctor_id,
      d.user_id,
      d.username,
      d.specialization,
      d.qualification,
      d.experience,
      d.consultation_fee,
      d.qr_code,

      u.full_name,
      u.email,
      u.phone_number,

      COALESCE(
        (
          SELECT JSON_ARRAYAGG(
            JSON_OBJECT(
              'id', di.id,
              'fileKey', di.file_key,
              'folder', di.folder_name,
              'createdAt', di.created_at
            )
          )
          FROM doctor_image di
          WHERE di.doctor_id = d.user_id
          AND di.file_key IS NOT NULL
        ),
        JSON_ARRAY()
      ) AS images,

      ROUND(
        IFNULL(
          (SELECT AVG(f.rating) FROM feedbacks f WHERE f.doctor_id = d.id),
          0
        ), 1
      ) AS avg_rating

    FROM doctors d
    LEFT JOIN users u ON u.id = d.user_id
  `;

  const [rows] = await db.execute(sql);
  return rows;
};

const findAllWithUser = async () => {
  const query = `
SELECT
  d.id AS doctor_id,
  d.user_id,
  d.username,
  d.specialization,
  d.qualification,
  d.experience,
  d.consultation_fee,
  d.medical_license_no,
  d.bio,
  d.language,
  d.availability,
  d.hospital_detail,
  d.qr_code,

  u.full_name AS user_full_name,
  u.email AS user_email,
  u.phone_number AS user_phone_number,

  COALESCE(
    (
      SELECT JSON_ARRAYAGG(
        JSON_OBJECT(
          'id', di.id,
          'fileKey', di.file_key,
          'folder', di.folder_name,
          'createdAt', di.created_at
        )
      )
      FROM doctor_image di
      WHERE di.doctor_id = d.user_id
      AND di.file_key IS NOT NULL
      AND di.file_key != ''
    ),
    JSON_ARRAY()
  ) AS images,

  ROUND(
    IFNULL(
      (SELECT AVG(f.rating) FROM feedbacks f WHERE f.doctor_id = d.id),
      0
    ), 1
  ) AS avg_rating

FROM doctors d
LEFT JOIN users u ON u.id = d.user_id;
  `;

  const [rows] = await db.execute(query); 
  return rows;
};


async function findUserByName(name) {
  const sql = `
    SELECT full_name, email, phone_number
    FROM users
    WHERE LOWER(full_name) = LOWER(?)
       OR LOWER(username) = LOWER(?)
    LIMIT 1
  `;

  const [rows] = await db.execute(sql, [name, name]);
  return rows[0] || null;
}

module.exports = {
  createDoctor,
  getByUserId,
  getBydoctorId,
  getDoctorPublicProfileById,
  getAllDoctors,
  updateDoctor,
  findAllWithUser,
  findUserByName,
  updateDoctorQr
};