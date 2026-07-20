const db = require("../config/db");

const createDoctor = async (userId, body) => {

  const fieldMap = {
    username: "username",
    specialization: "specialization",
    qualification: "qualification",
    experience: "experience",
    language: "language",
    consultationFee: "consultation_fee",
    medicalLicenseNo: "medical_license_no",
    bio: "bio",
    availability: "availability",
    hospitalDetail: "hospital_detail",
    age: "age",
    gender: "gender"
  };

  const jsonFields = [
    "language",
    "availability",
    "hospitalDetail"
  ];

  const defaultValues = {
    username: "",
    specialization: "",
    qualification: "",
    experience: null,
    language: JSON.stringify([]),
    consultationFee: 0,
    medicalLicenseNo: "",
    bio: "",
    availability: JSON.stringify([]),
    hospitalDetail: JSON.stringify([]),
    age: null,
    gender: null
  };

  const columns = ["user_id"];
  const placeholders = ["?"];
  const values = [userId];

  for (const key of Object.keys(fieldMap)) {
    columns.push(fieldMap[key]);
    placeholders.push("?");

    if (Object.prototype.hasOwnProperty.call(body, key) && body[key] !== undefined && body[key] !== null) {
      if (jsonFields.includes(key)) {
        values.push(JSON.stringify(body[key]));
      } else {
        values.push(body[key]);
      }
    } else {
      values.push(defaultValues[key]);
    }
  }

  const sql = `
    INSERT INTO doctors
    (${columns.join(", ")})
    VALUES (${placeholders.join(", ")})
  `;

  const [result] = await db.execute(sql, values);

  return result;
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
        FROM user_images di
        WHERE di.user_id = d.user_id
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
      d.age,
      d.gender,
      d.bio,
      d.language,
      d.availability,
      d.hospital_detail,
      d.qr_code,

      u.full_name AS user_full_name,
      u.email AS user_email,
      u.phone_number AS user_phone_number,


      (
        SELECT di.file_key
        FROM user_images di
        WHERE di.user_id = d.user_id
        AND di.file_key IS NOT NULL
        ORDER BY di.id DESC
        LIMIT 1
      ) AS image_file_key,

      (
        SELECT di.folder_name
        FROM user_images di
        WHERE di.user_id = d.user_id
        AND di.file_key IS NOT NULL
        ORDER BY di.id DESC
        LIMIT 1
      ) AS image_folder_name,


      COALESCE(
        (
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
        ),
        JSON_ARRAY()
      ) AS files,

      (
        SELECT ROUND(AVG(f.rating), 1)
        FROM feedbacks f
        WHERE f.doctor_id = d.user_id
      ) AS avg_rating,

      (
        SELECT COUNT(*)
        FROM feedbacks f
        WHERE f.doctor_id = d.user_id
      ) AS total_feedbacks,

      (
        SELECT SUM(CASE WHEN f.rating > 3 THEN 1 ELSE 0 END)
        FROM feedbacks f
        WHERE f.doctor_id = d.user_id
      ) AS positive_feedbacks,

      (
        SELECT SUM(CASE WHEN f.rating <= 3 THEN 1 ELSE 0 END)
        FROM feedbacks f
        WHERE f.doctor_id = d.user_id
      ) AS negative_feedbacks

    FROM doctors d

    LEFT JOIN users u
      ON u.id = d.user_id

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
      d.age,
      d.gender,
      d.bio,
      d.language,
      d.availability,
      d.hospital_detail,

      u.full_name AS user_full_name,
      u.email AS user_email,
      u.phone_number AS user_phone_number,

      (
        SELECT di.file_key
        FROM user_images di
        WHERE (di.user_id = d.user_id OR di.user_id = d.id)
          AND di.file_key IS NOT NULL
        ORDER BY di.id DESC
        LIMIT 1
      ) AS image_file_key,

      (
        SELECT ROUND(AVG(f.rating), 1)
        FROM feedbacks f
        WHERE f.doctor_id = d.user_id
          AND f.rating IS NOT NULL
      ) AS avg_rating,

      (
        SELECT COUNT(*)
        FROM feedbacks f
        WHERE f.doctor_id = d.user_id
      ) AS total_feedbacks,

      (
        SELECT COUNT(f.rating)
        FROM feedbacks f
        WHERE f.doctor_id = d.user_id
          AND f.rating IS NOT NULL
      ) AS total_ratings

    FROM doctors d

    LEFT JOIN users u
      ON u.id = d.user_id

    WHERE u.id = ?

    LIMIT 1
  `;

  const [rows] = await db.execute(sql, [doctorId]);

  return rows[0] || null;
};

const getDoctorByUserId = async (userId) => {

  const [rows] = await db.execute(
    `
      SELECT id
      FROM doctors
      WHERE user_id = ?
      LIMIT 1
    `,
    [userId]
  );

  return rows.length ? rows[0] : null;
};

const updateDoctor = async (userId, body) => {

  const fields = [];
  const values = [];

  const fieldMap = {
    username: "username",
    specialization: "specialization",
    qualification: "qualification",
    experience: "experience",
    language: "language",
    consultationFee: "consultation_fee",
    medicalLicenseNo: "medical_license_no",
    bio: "bio",
    availability: "availability",
    hospitalDetail: "hospital_detail",
    age: "age",
    gender: "gender"
  };

  const jsonFields = [
    "language",
    "availability",
    "hospitalDetail"
  ];

  for (const key of Object.keys(body)) {

    if (!fieldMap[key]) continue;

    fields.push(`${fieldMap[key]} = ?`);

    if (jsonFields.includes(key)) {
      values.push(JSON.stringify(body[key]));
    } else {
      values.push(body[key]);
    }
  }

  if (fields.length === 0) {
    return { affectedRows: 0 };
  }

  values.push(userId);

  const sql = `
    UPDATE doctors
    SET ${fields.join(", ")}
    WHERE user_id = ?
  `;

  const [result] = await db.execute(sql, values);

  return result;
};

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
          FROM user_images di
          WHERE di.user_id = d.user_id
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
u.id AS user_id,
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
d.age,
d.gender,
u.full_name AS user_full_name,
u.email AS user_email,
u.phone_number AS user_phone_number,
COALESCE(
(
SELECT JSON_ARRAYAGG(
JSON_OBJECT(
'id',di.id,
'fileKey',di.file_key,
'folder',di.folder_name,
'createdAt',di.created_at
)
)

FROM user_images di
WHERE di.user_id=u.id

),

JSON_ARRAY()

) AS images,

ROUND(

IFNULL(

(

SELECT AVG(f.rating)
FROM feedbacks f
WHERE f.doctor_id=u.id

),

0

),

1

) AS avg_rating,

(

SELECT COUNT(*)
FROM feedbacks f
WHERE f.doctor_id=u.id
) AS total_feedbacks,

(

SELECT COUNT(f.rating)
FROM feedbacks f
WHERE f.doctor_id=u.id
AND f.rating IS NOT NULL

) AS total_ratings

FROM users u

LEFT JOIN doctors d

ON d.user_id=u.id

WHERE u.role_id=2

ORDER BY u.id DESC;

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
  getDoctorByUserId,
  getDoctorPublicProfileById,
  getAllDoctors,
  updateDoctor,
  findAllWithUser,
  findUserByName,
  updateDoctorQr
};