const db = require("../../config/db");


exports.createAssistantProfile = async (userId, data) => {

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
    INSERT INTO assistant_profiles
    (${columns.join(", ")})
    VALUES (${placeholders.join(", ")})
  `;

  const [result] = await db.query(sql, values);

  return result.affectedRows > 0;
};

exports.getAssistantProfile = async (userId) => {

  // Assistant profile check
  const [rows] = await db.query(
    `
    SELECT
      ap.gender,
      ap.age,
      ap.department,
      ap.education,
      ap.experience,
      ap.language,
      DATE_FORMAT(ap.created_at,'%d-%m-%Y') AS joining_date,
      ap.address,
      ap.bio,

      u.full_name,
      u.email,
      u.phone_number,

      doctor.full_name AS doctor_assign

    FROM assistant_profiles ap

    LEFT JOIN users u
      ON u.id = ap.user_id

    LEFT JOIN users doctor
      ON doctor.id = u.doctor_id

    WHERE ap.user_id = ?

    LIMIT 1
    `,
    [userId]
  );

  // Profile exists
  if (rows.length > 0) {
    return rows[0];
  }

  // Profile doesn't exist -> fetch users table
  const [userRows] = await db.query(
    `
    SELECT
      full_name,
      email,
      phone_number
    FROM users
    WHERE id = ?
    LIMIT 1
    `,
    [userId]
  );

  if (userRows.length === 0) {
    return null;
  }

  return {
    full_name: userRows[0].full_name,
    email: userRows[0].email,
    phone_number: userRows[0].phone_number,

    gender: null,
    age: null,
    department: null,
    education: null,
    experience: null,
    language: null,
    joining_date: null,
    address: null,
    bio: null,
    doctor_assign: null
  };
};

exports.hasAssistantProfile = async (userId) => {
  const [rows] = await db.query(
    `
    SELECT 1
    FROM assistant_profiles
    WHERE user_id = ?
    LIMIT 1
    `,
    [userId]
  );

  return rows.length > 0;
};

exports.getAssistantProfileByUserId = async (userId) => {

  const [rows] = await db.query(
    `
    SELECT id
    FROM assistant_profiles
    WHERE user_id = ?
    LIMIT 1
    `,
    [userId]
  );

  return rows.length ? rows[0] : null;
};

exports.updateAssistantProfile = async (userId, data) => {

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
    return false;
  }

  values.push(userId);

  const sql = `
    UPDATE assistant_profiles
    SET ${fields.join(", ")}
    WHERE user_id = ?
  `;

  const [result] = await db.query(sql, values);

  return result.affectedRows > 0;
};

exports.getAllAssistantProfiles = async (doctorId) => {

  const [rows] = await db.query(
    `
    SELECT
    u.id,
    u.full_name,
    u.email,
    u.phone_number,
    u.doctor_id,
    ap.id AS profile_id,
    ap.gender,
    ap.age,
    ap.department,
    ap.education,
    ap.experience,
    ap.language,
    ap.address,
    ap.bio

FROM users u

LEFT JOIN assistant_profiles ap
    ON ap.user_id = u.id

WHERE u.doctor_id = ?

ORDER BY u.id DESC;
    `,
    [doctorId]
  );

  return rows;
};

exports.getOrphanProfileByUser = async (userId) => {

  const [rows] = await db.query(

    `
    SELECT
      ap.*,
      u.full_name,
      u.email,
      u.phone_number

    FROM assistant_profiles ap

    LEFT JOIN users u
      ON u.id = ap.user_id

    WHERE ap.user_id = ?

    ORDER BY ap.id DESC

    LIMIT 1

    `,

    [userId]
  );


  return rows[0];

};