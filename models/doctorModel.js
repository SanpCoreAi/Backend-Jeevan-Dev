const db = require("../config/db");

exports.createDoctor = async (userId, data) => {
  const fieldMap = {
    username: "username",
    specialization: "specialization",
    qualification: "qualification",
    experience: "experience",
    consultation_fee: "consultation_fee",
    consultationFee: "consultation_fee",
    medical_license_no: "medical_license_no",
    medicalLicenseNo: "medical_license_no",
    bio: "bio",
    age: "age",
    gender: "gender",
    language: "language",
    availability: "availability",
    hospital_detail: "hospital_detail",
    hospitalDetail: "hospital_detail"
  };

  const jsonFields = [
    "language",
    "availability",
    "hospitalDetail",
    "hospital_detail"
  ];

  const columns = ["user_id"];
  const placeholders = ["?"];
  const values = [userId];

  for (const key of Object.keys(data)) {

    if (!fieldMap[key]) continue;

    columns.push(fieldMap[key]);
    placeholders.push("?");

    if (jsonFields.includes(key)) {
      values.push(JSON.stringify(data[key]));
    } else {
      values.push(data[key]);
    }
  }

  const sql = `
    INSERT INTO doctors
    (${columns.join(", ")})
    VALUES (${placeholders.join(", ")})
  `;

  const [result] = await db.execute(sql, values);

  return {
    insertId: result.insertId,
    affectedRows: result.affectedRows
  };
};

exports.getByUserId = async (userId) => {

  const sql = `
    SELECT
      d.*,
      d.qr_code,
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
      ), 0) AS avg_rating

    FROM doctors d
    LEFT JOIN users u
      ON u.id = d.user_id

    WHERE d.user_id = ?

    LIMIT 1
  `;

  const [rows] = await db.execute(sql, [userId]);

  return rows[0] || null;
};

exports.getBydoctorId = async (userId) => {

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
        SELECT ui.file_key
        FROM user_images ui
        WHERE ui.user_id = d.user_id
          AND ui.file_key IS NOT NULL
        ORDER BY ui.id DESC
        LIMIT 1
      ) AS image_file_key,

      (
        SELECT ui.folder_name
        FROM user_images ui
        WHERE ui.user_id = d.user_id
          AND ui.file_key IS NOT NULL
        ORDER BY ui.id DESC
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

      COALESCE(
        (
          SELECT ROUND(AVG(f.rating), 1)
          FROM feedbacks f
          WHERE f.doctor_id = d.user_id
        ),
        0
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
      ) AS total_ratings,

      COALESCE(
        (
          SELECT SUM(CASE WHEN f.rating > 3 THEN 1 ELSE 0 END)
          FROM feedbacks f
          WHERE f.doctor_id = d.user_id
        ),
        0
      ) AS positive_feedbacks,

      COALESCE(
        (
          SELECT SUM(CASE WHEN f.rating <= 3 THEN 1 ELSE 0 END)
          FROM feedbacks f
          WHERE f.doctor_id = d.user_id
        ),
        0
      ) AS negative_feedbacks

    FROM doctors d

    INNER JOIN users u
      ON u.id = d.user_id

    WHERE d.user_id = ?

    LIMIT 1
  `;

  const [rows] = await db.execute(sql, [userId]);

  return rows.length ? rows[0] : null;
};

exports.updateDoctorQr = async (doctorId, qrCode) => {

  const sql = `
    UPDATE doctors
    SET qr_code = ?
    WHERE user_id = ?
    LIMIT 1
  `;

  const [result] = await db.execute(sql, [
    qrCode,
    doctorId
  ]);

  return {
    affectedRows: result.affectedRows,
    changedRows: result.changedRows
  };
};

exports.getDoctorPublicProfileById = async (userId) => {

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

      u.full_name AS user_full_name,
      u.email AS user_email,
      u.phone_number AS user_phone_number,

      (
        SELECT ui.file_key
        FROM user_images ui
        WHERE ui.user_id = d.user_id
          AND ui.file_key IS NOT NULL
        ORDER BY ui.id DESC
        LIMIT 1
      ) AS image_file_key,

      COALESCE(
        (
          SELECT ROUND(AVG(f.rating), 1)
          FROM feedbacks f
          WHERE f.doctor_id = d.user_id
        ),
        0
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
      ) AS total_ratings,

      COALESCE(
        (
          SELECT SUM(
            CASE
              WHEN f.rating > 3 THEN 1
              ELSE 0
            END
          )
          FROM feedbacks f
          WHERE f.doctor_id = d.user_id
        ),
        0
      ) AS positive_feedbacks,

      COALESCE(
        (
          SELECT SUM(
            CASE
              WHEN f.rating <= 3 THEN 1
              ELSE 0
            END
          )
          FROM feedbacks f
          WHERE f.doctor_id = d.user_id
        ),
        0
      ) AS negative_feedbacks

    FROM doctors d

    INNER JOIN users u
      ON u.id = d.user_id

    WHERE
      d.user_id = ?
      AND u.status = 'ACTIVE'

    LIMIT 1
  `;

  const [rows] = await db.execute(sql, [userId]);

  return rows.length ? rows[0] : null;
};

exports.getDoctorByUserId = async (userId) => {

  const sql = `
    SELECT
      id,
      user_id
    FROM doctors
    WHERE user_id = ?
    LIMIT 1
  `;

  const [rows] = await db.execute(sql, [userId]);

  return rows.length ? rows[0] : null;
};

exports.updateDoctor = async (userId, data) => {

  const fieldMap = {
    username: "username",
    specialization: "specialization",
    qualification: "qualification",
    experience: "experience",
    consultationFee: "consultation_fee",
    consultation_fee: "consultation_fee",
    medicalLicenseNo: "medical_license_no",
    medical_license_no: "medical_license_no",
    bio: "bio",
    age: "age",
    gender: "gender",
    language: "language",
    availability: "availability",
    hospitalDetail: "hospital_detail",
    hospital_detail: "hospital_detail"
  };

  const jsonFields = [
    "language",
    "availability",
    "hospitalDetail",
    "hospital_detail"
  ];

  const fields = [];
  const values = [];

  for (const key of Object.keys(data)) {

    if (!fieldMap[key]) continue;

    fields.push(`${fieldMap[key]} = ?`);

    if (jsonFields.includes(key)) {
      values.push(JSON.stringify(data[key]));
    } else {
      values.push(data[key]);
    }
  }

  if (fields.length === 0) {
    return {
      affectedRows: 0,
      changedRows: 0
    };
  }

  fields.push("updated_at = CURRENT_TIMESTAMP");

  values.push(userId);

  const sql = `
    UPDATE doctors
    SET
      ${fields.join(", ")}
    WHERE user_id = ?
    LIMIT 1
  `;

  const [result] = await db.execute(sql, values);

  return {
    affectedRows: result.affectedRows,
    changedRows: result.changedRows
  };
};

exports.getAllDoctors = async () => {

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
          (
            SELECT AVG(f.rating)
            FROM feedbacks f
            WHERE f.doctor_id = d.user_id
          ),
          0
        ),
        1
      ) AS avg_rating

    FROM doctors d

    INNER JOIN users u
      ON u.id = d.user_id

    WHERE u.status = 'ACTIVE'

    ORDER BY d.id DESC
  `;

  const [rows] = await db.execute(sql);

  return rows;
};

exports.findAllWithUser = async () => {

  const sql = `
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
      d.age,
      d.gender,
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
              'id', ui.id,
              'fileKey', ui.file_key,
              'folder', ui.folder_name,
              'createdAt', ui.created_at
            )
          )
          FROM user_images ui
          WHERE ui.user_id = d.user_id
        ),
        JSON_ARRAY()
      ) AS images,

      COALESCE(
        (
          SELECT ROUND(AVG(f.rating),1)
          FROM feedbacks f
          WHERE f.doctor_id = d.user_id
        ),
        0
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
      ) AS total_ratings,

      COALESCE(
        (
          SELECT SUM(
            CASE
              WHEN f.rating > 3 THEN 1
              ELSE 0
            END
          )
          FROM feedbacks f
          WHERE f.doctor_id = d.user_id
        ),
        0
      ) AS positive_feedbacks,

      COALESCE(
        (
          SELECT SUM(
            CASE
              WHEN f.rating <= 3 THEN 1
              ELSE 0
            END
          )
          FROM feedbacks f
          WHERE f.doctor_id = d.user_id
        ),
        0
      ) AS negative_feedbacks

    FROM doctors d

    INNER JOIN users u
      ON u.id = d.user_id

    WHERE u.status = 'ACTIVE'

    ORDER BY d.id DESC
  `;

  const [rows] = await db.execute(sql);

  return rows;
};

exports.findUserByName = async (name) => {

  const sql = `
    SELECT
      full_name,
      email,
      phone_number
    FROM users
    WHERE LOWER(full_name) = LOWER(?)
       OR LOWER(username) = LOWER(?)
    LIMIT 1
  `;

  const [rows] = await db.execute(sql, [name, name]);

  return rows[0] || null;
};