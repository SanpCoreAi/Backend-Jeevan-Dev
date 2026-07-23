const db = require("../../config/db");

const fieldMap = {
  gender: "gender",
  age: "age",
  department: "department",
  education: "education",
  experience: "experience",
  language: "language",
  address: "address",
  bio: "bio"
};

const jsonFields = [
  "language",
  "address"
];

const formatValue = (key, value) => {
  return jsonFields.includes(key)
    ? JSON.stringify(value)
    : value;
};

exports.createAssistantProfile = async (userId, data) => {

  const columns = ["user_id"];
  const placeholders = ["?"];
  const values = [userId];

  Object.keys(data).forEach((key) => {

    if (!fieldMap[key]) return;

    columns.push(fieldMap[key]);
    placeholders.push("?");
    values.push(formatValue(key, data[key]));

  });

  const sql = `
      INSERT INTO assistant_profiles
      (${columns.join(",")})
      VALUES (${placeholders.join(",")})
  `;

  const [result] =
    await db.execute(sql, values);

  return result.affectedRows > 0;

};

exports.getAssistantProfile = async (userId) => {

  const [rows] =
    await db.execute(

      `
      SELECT

        ap.gender,
        ap.age,
        ap.department,
        ap.education,
        ap.experience,
        ap.language,
        DATE_FORMAT(
          ap.created_at,
          '%d-%m-%Y'
        ) joining_date,
        ap.address,
        ap.bio,

        u.id user_id,
        u.full_name,
        u.email,
        u.phone_number,

        doctor.full_name doctor_assign,

        (
            SELECT file_key
            FROM user_images
            WHERE user_id=u.id
            ORDER BY id DESC
            LIMIT 1
        ) image_key

      FROM users u

      LEFT JOIN assistant_profiles ap
      ON ap.user_id=u.id

      LEFT JOIN users doctor
      ON doctor.id=u.doctor_id

      WHERE u.id=?

      LIMIT 1
      `,
      [userId]
    );

  return rows[0] || null;

};

exports.getAssistantProfileByUserId = async (userId) => {

  const [rows] =
    await db.execute(

      `
      SELECT id
      FROM assistant_profiles
      WHERE user_id=?
      LIMIT 1
      `,
      [userId]
    );

  return rows[0] || null;

};

exports.updateAssistantProfile = async (
  userId,
  data
) => {

  const updates = [];
  const values = [];

  Object.keys(data).forEach((key) => {

    if (!fieldMap[key]) return;

    updates.push(`${fieldMap[key]}=?`);

    values.push(
      formatValue(key, data[key])
    );

  });

  if (!updates.length) {
    return false;
  }

  values.push(userId);

  const sql = `
      UPDATE assistant_profiles
      SET ${updates.join(",")}
      WHERE user_id=?
  `;

  const [result] =
    await db.execute(sql, values);

  return result.affectedRows > 0;

};

exports.getAllAssistantProfiles = async (
  doctorId
) => {

  const [rows] =
    await db.execute(

      `
      SELECT

          u.id,
          u.full_name,
          u.email,
          u.phone_number,
          u.doctor_id,

          ap.id profile_id,
          ap.gender,
          ap.age,
          ap.department,
          ap.education,
          ap.experience,
          ap.language,
          ap.address,
          ap.bio,

          (
              SELECT file_key
              FROM user_images
              WHERE user_id=u.id
              ORDER BY id DESC
              LIMIT 1
          ) image_key

      FROM users u

      LEFT JOIN assistant_profiles ap
      ON ap.user_id=u.id

      WHERE u.doctor_id=?

      ORDER BY u.id DESC
      `,
      [doctorId]
    );

  return rows;

};

exports.getOrphanProfileByUser = async (
  userId
) => {

  const [rows] =
    await db.execute(

      `
      SELECT

          ap.*,

          u.full_name,
          u.email,
          u.phone_number

      FROM assistant_profiles ap

      LEFT JOIN users u
      ON u.id=ap.user_id

      WHERE ap.user_id=?

      ORDER BY ap.id DESC

      LIMIT 1
      `,
      [userId]
    );

  return rows[0] || null;

};

exports.getAllAssistantProfile = async () => {

  const [rows] = await db.execute(

    `
    SELECT

      u.id AS user_id,
      u.full_name,
      u.email,
      u.phone_number,

      doctor.full_name AS doctor_assign,

      ap.gender,
      ap.age,
      ap.department,
      ap.education,
      ap.experience,
      ap.language,
      ap.address,
      ap.bio,

      (
        SELECT file_key
        FROM user_images
        WHERE user_id = u.id
        ORDER BY id DESC
        LIMIT 1
      ) AS image_key

    FROM users u

    LEFT JOIN assistant_profiles ap
      ON ap.user_id = u.id

    LEFT JOIN users doctor
      ON doctor.id = u.doctor_id

    WHERE u.role_id = 3

    ORDER BY u.id DESC
    `

  );

  return rows;

};