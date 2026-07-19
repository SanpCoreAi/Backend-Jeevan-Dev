const db = require("../config/db");


exports.getUserProfileByUserId = async (userId) => {
  const sql = `
    SELECT *
    FROM user_profiles
    WHERE user_id = ?
    LIMIT 1
  `;

  const [rows] = await db.execute(sql, [userId]);

  return rows.length ? rows[0] : null;
};

exports.createUserProfile = async (userId, body) => {
  const fieldMap = {
    username: "username",
    age: "age",
    gender: "gender",
    language: "language",
    address: "address",
    blood_group: "blood_group",
    weight: "weight",
    height: "height",
    existing_conditions: "existing_conditions",
    allergies: "allergies",
    bio: "bio",
    emergency_contact: "emergency_contact"
  };

  const jsonFields = [
    "language",
    "address",
    "existing_conditions",
    "allergies",
    "emergency_contact"
  ];

  const columns = ["user_id"];
  const placeholders = ["?"];
  const values = [userId];

  for (const key of Object.keys(body)) {
    if (!fieldMap[key]) continue;

    columns.push(fieldMap[key]);
    placeholders.push("?");

    if (jsonFields.includes(key)) {
      values.push(JSON.stringify(body[key]));
    } else {
      values.push(body[key]);
    }
  }

  const sql = `
    INSERT INTO user_profiles
    (${columns.join(", ")})
    VALUES (${placeholders.join(", ")})
  `;

  const [result] = await db.execute(sql, values);

  return result.affectedRows > 0;
};

exports.updateUserProfile = async (userId, body) => {
  const fieldMap = {
    username: "username",
    age: "age",
    gender: "gender",
    language: "language",
    address: "address",
    blood_group: "blood_group",
    weight: "weight",
    height: "height",
    existing_conditions: "existing_conditions",
    allergies: "allergies",
    bio: "bio",
    emergency_contact: "emergency_contact"
  };

  const jsonFields = [
    "language",
    "address",
    "existing_conditions",
    "allergies",
    "emergency_contact"
  ];

  const updates = [];
  const values = [];

  for (const key of Object.keys(body)) {
    if (!fieldMap[key]) continue;

    updates.push(`${fieldMap[key]} = ?`);

    if (jsonFields.includes(key)) {
      values.push(JSON.stringify(body[key]));
    } else {
      values.push(body[key]);
    }
  }

  if (updates.length === 0) {
    return false;
  }

  values.push(userId);

  const sql = `
    UPDATE user_profiles
    SET ${updates.join(", ")}
    WHERE user_id = ?
  `;

  const [result] = await db.execute(sql, values);

  return result.affectedRows > 0;
};

exports.getUserProfileByUserIds = async (userId) => {

  const [rows] = await db.execute(
    `
    SELECT
      u.id AS user_id,
      u.full_name,
      u.email,
      u.phone_number,

      p.username,
      p.age,
      p.gender,
      p.language,
      p.address,
      p.blood_group,
      p.weight,
      p.height,
      p.existing_conditions,
      p.allergies,
      p.bio,
      p.emergency_contact,

      COALESCE(
        (
          SELECT di.file_key
          FROM doctor_image di
          WHERE di.doctor_id = u.id
            AND di.file_key IS NOT NULL
          ORDER BY di.id DESC
          LIMIT 1
        ),
        (
          SELECT ui.file_key
          FROM user_images ui
          WHERE ui.user_id = u.id
            AND ui.file_key IS NOT NULL
          ORDER BY ui.id DESC
          LIMIT 1
        )
      ) AS image_key

    FROM users u

    LEFT JOIN user_profiles p
      ON p.user_id = u.id

    WHERE u.id = ?

    LIMIT 1
    `,
    [userId]
  );

  if (rows.length === 0) {
    return null;
  }

  return rows[0];
};

exports.checkDoctorPatientRelation = async (
  doctorId,
  patientId
) => {

  const sql = `
    SELECT id

    FROM appointments

    WHERE doctor_id = ?
    AND patient_id = ?

    LIMIT 1
  `;

  const [rows] = await db.execute(sql, [
    doctorId,
    patientId
  ]);

  return rows.length > 0;
};

exports.getPatientCardProfile = async (
  patientId
) => {

  const sql = `
    SELECT 
      u.id AS patient_id,

      u.full_name,

      u.phone_number,

      p.gender,
      p.weight,
      p.height,
      p.age,
      p.created_at,

      (
        SELECT DATE_FORMAT(
          a.created_at,
          '%d-%m-%Y %h:%i %p'
        )

        FROM appointments a

        WHERE a.patient_id = u.id

        ORDER BY a.created_at DESC

        LIMIT 1
      ) AS last_appointment_booked

    FROM users u

    LEFT JOIN user_profiles p
      ON u.id = p.user_id

    WHERE u.id = ?

    LIMIT 1
  `;

  const [rows] = await db.execute(sql, [
    patientId
  ]);

  return rows[0];
};



exports.getPatientDetails = async (doctorId, appointmentId) => {
  const [rows] = await db.execute(
    `
    SELECT
        u.id AS user_id,
        u.full_name,
        u.phone_number,
        u.email,

        up.age,
        up.gender,
        up.weight,
        up.height,
        up.blood_group,
        up.created_at,

        a.id AS appointment_id,
        a.slot_date,
        a.appointment_type,
        a.status,
        a.reason_for_visit,
        a.hospital_name

    FROM appointments a

    INNER JOIN users u
        ON u.id = a.patient_id

    LEFT JOIN user_profiles up
        ON up.user_id = a.patient_id

    WHERE
        a.id = ?
        AND a.doctor_id = ?

    LIMIT 1
    `,
    [appointmentId, doctorId]
  );

  return rows[0] || null;
};

exports.getAllUsers = async () => {
  const sql = `
    SELECT
      u.id AS user_id,
      u.full_name,
      u.email,
      u.phone_number,
      u.role_id,

      p.username,
      p.age,
      p.gender,
      p.language,
      p.address,
      p.blood_group,
      p.weight,
      p.height,
      p.existing_conditions,
      p.allergies,
      p.bio,
      p.emergency_contact

    FROM users u

    LEFT JOIN user_profiles p
      ON u.id = p.user_id

    WHERE u.role_id = 1

    ORDER BY u.id DESC
  `;

  const [rows] = await db.execute(sql);

  return rows;
};