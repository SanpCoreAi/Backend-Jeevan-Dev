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
    hospitalDetail: "hospital_detail",

    acceptEmergencyPatients: "accept_emergency_patients",
  };

  const jsonFields = [
    "language",
    "availability",
    "hospitalDetail",
    "hospital_detail",
  ];

  const columns = ["user_id"];
  const placeholders = ["?"];
  const values = [userId];

  for (const key of Object.keys(data)) {
    if (!fieldMap[key]) {
      continue;
    }

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
    affectedRows: result.affectedRows,
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
  try {
    const sql = `
      SELECT
        u.id AS user_id,
        u.registration_id,

        dr.full_name,
        dr.gender,
        dr.age,
        dr.email,
        dr.mobile,
        dr.medical_registration_number,
        dr.medical_council,
        dr.qualification,
        dr.specialization,
        dr.registration_expiry_date,
        dr.onboarding_status,
        dr.medical_registration_certificate,
        dr.medical_degree_certificate,
        dr.government_id_proof,
        dr.selfie,

        d.id AS doctor_id,
        d.experience,
        d.language,
        d.consultation_fee,
        d.bio,
        d.availability,
        d.hospital_detail,
        d.qr_url,
        d.accept_emergency_patients

      FROM users u

      LEFT JOIN doctor_registrations dr
        ON dr.id = u.registration_id

      LEFT JOIN doctors d
        ON d.user_id = u.id

      WHERE u.id = ?

      LIMIT 1
    `;

    const [rows] = await db.execute(sql, [userId]);

    return rows.length > 0 ? rows[0] : null;

  } catch (error) {
    console.error(
      "GET DOCTOR PROFILE MODEL ERROR:",
      error
    );

    throw error;
  }
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

      u.registration_id,

      dr.full_name,
      dr.gender,
      dr.age,
      dr.email,
      dr.mobile,
      dr.medical_registration_number,
      dr.medical_council,
      dr.qualification,
      dr.specialization,
      dr.selfie,

      d.id,
      d.user_id,
      d.experience,
      d.language,
      d.consultation_fee,
      d.bio,
      d.availability,
      d.hospital_detail,
      d.qr_url,
      d.accept_emergency_patients,

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

    LEFT JOIN doctor_registrations dr
      ON dr.id = u.registration_id

    WHERE d.user_id = ?

    LIMIT 1
  `;

  const [rows] = await db.execute(sql, [userId]);

  return rows.length ? rows[0] : null;
};

exports.getDoctorByUserId = async (userId) => {
  const sql = `
    SELECT
      d.id AS doctor_id,
      d.user_id,
      u.id AS users_id,
      d.registration_id,
      d.medical_license_no
    FROM doctors d
    INNER JOIN users u
      ON u.id = d.user_id
    WHERE d.user_id = ?
      AND u.id = ?
    LIMIT 1
  `;

  const [rows] = await db.execute(sql, [
    userId,
    userId
  ]);

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
    hospital_detail: "hospital_detail",

    acceptEmergencyPatients: "accept_emergency_patients",
  };

  const jsonFields = [
    "language",
    "availability",
    "hospitalDetail",
    "hospital_detail",
  ];

  const fields = [];
  const values = [];

  for (const key of Object.keys(data)) {
    if (!fieldMap[key]) {
      continue;
    }

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
      changedRows: 0,
    };
  }

  fields.push("updated_at = CURRENT_TIMESTAMP");

  values.push(userId);

  const sql = `
    UPDATE doctors
    SET ${fields.join(", ")}
    WHERE user_id = ?
    LIMIT 1
  `;

  const [result] = await db.execute(sql, values);

  return {
    affectedRows: result.affectedRows,
    changedRows: result.changedRows,
  };
};

exports.getDoctorByMedicalLicenseNo = async (medicalLicenseNo) => {
  const sql = `
    SELECT id, user_id
    FROM doctors
    WHERE medical_license_no = ?
    LIMIT 1
  `;

  const [rows] = await db.execute(sql, [medicalLicenseNo]);

  return rows.length ? rows[0] : null;
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

exports.findAllWithRegistration = async ({
  limit = 10,
  offset = 0,
  search = "",
} = {}) => {

  const safeLimit = Math.min(
    100,
    Math.max(
      1,
      Number.parseInt(limit, 10) || 10
    )
  );

  const safeOffset = Math.max(
    0,
    Number.parseInt(offset, 10) || 0
  );

  let where = "";
  const params = [];

  const trimmedSearch =
    String(search || "").trim();

  if (trimmedSearch) {

    where = `
      WHERE
        dr.full_name LIKE ?
        OR dr.email LIKE ?
        OR dr.mobile LIKE ?
        OR dr.medical_registration_number LIKE ?
        OR dr.medical_council LIKE ?
        OR dr.qualification LIKE ?
        OR dr.specialization LIKE ?
    `;

    const searchValue =
      `%${trimmedSearch}%`;

    params.push(
      searchValue,
      searchValue,
      searchValue,
      searchValue,
      searchValue,
      searchValue,
      searchValue
    );
  }

  const countSql = `
    SELECT COUNT(*) AS total

    FROM doctors d

    INNER JOIN users u
      ON u.id = d.user_id

    LEFT JOIN doctor_registrations dr
      ON dr.id = u.registration_id

    ${where}
  `;

  const [countRows] =
    await db.execute(
      countSql,
      params
    );

  const total =
    Number(
      countRows[0]?.total || 0
    );

  const sql = `
    SELECT

      u.registration_id,

      dr.full_name,
      dr.gender,
      dr.age,
      dr.email,
      dr.mobile,
      dr.medical_registration_number,
      dr.medical_council,
      dr.qualification,
      dr.specialization,
      dr.onboarding_status,
      dr.selfie,

      d.id AS doctor_id,
      d.user_id,

      d.experience,
      d.language,
      d.consultation_fee,
      d.bio,
      d.availability,
      d.hospital_detail,
      d.qr_url,
      d.accept_emergency_patients,

      COALESCE(
        (
          SELECT ROUND(
            AVG(f.rating),
            1
          )
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
              WHEN f.rating > 3
              THEN 1
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
              WHEN f.rating <= 3
              THEN 1
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

    LEFT JOIN doctor_registrations dr
      ON dr.id = u.registration_id

    ${where}

    ORDER BY d.id DESC

    LIMIT ${safeLimit}

    OFFSET ${safeOffset}
  `;

  const [rows] =
    await db.execute(
      sql,
      params
    );

  return {
    rows,
    total,
  };
};

exports.findAllWithUsers = async () => {
  try {
    const sql = `
      SELECT
        u.registration_id,

        dr.full_name AS user_full_name,
        dr.gender,
        dr.age,
        dr.email AS user_email,
        dr.mobile AS user_phone_number,
        dr.medical_council,
        dr.qualification,
        dr.specialization,
        dr.onboarding_status,
        dr.selfie,

        d.id AS doctor_id,
        d.user_id,
        d.experience,
        d.language,
        d.consultation_fee,
        d.bio,
        d.availability,
        d.hospital_detail,
        d.qr_url,
        d.accept_emergency_patients,

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
            SELECT ROUND(
              AVG(f.rating),
              1
            )
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

        -- negative feedbacks
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

      LEFT JOIN doctor_registrations dr
        ON dr.id = u.registration_id

      ORDER BY d.id DESC
    `;

    const [rows] = await db.execute(sql);

    return rows;

  } catch (error) {
    console.error(
      "FIND ALL DOCTORS MODEL ERROR:",
      error
    );

    throw error;
  }
};

exports.findAllWithUser = async () => {
  try {
    const sql = `
      SELECT
        u.registration_id,

    dr.full_name,
    dr.gender,
    dr.age,
    dr.email,
    dr.mobile,
    dr.medical_council,
    dr.qualification,
    dr.specialization,
    dr.onboarding_status,
    dr.selfie,

    d.id AS doctor_id,
    d.user_id,
    d.experience,
    d.language,
    d.consultation_fee,
    d.bio,
    d.availability,
    d.hospital_detail,
    d.qr_url,
    d.accept_emergency_patients,

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
            SELECT ROUND(
              AVG(f.rating),
              1
            )
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

      LEFT JOIN doctor_registrations dr
        ON dr.id = u.registration_id

      ORDER BY d.id DESC
    `;

    const [rows] = await db.execute(sql);

    return rows;

  } catch (error) {
    console.error(
      "FIND ALL DOCTORS MODEL ERROR:",
      error
    );

    throw error;
  }
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