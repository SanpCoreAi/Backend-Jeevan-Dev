const db = require("../config/db");

exports.createUserProfile = async (userId, data = {}) => {
  const {
    age = null,
    gender = null,
    language = [],
    address = {},
    blood_group = null,
    existing_conditions = [],
    allergies = [],
    bio = null
  } = data;

  const validGender = typeof gender === "string" ? gender.substring(0, 20) : null;

  const sql = `
    INSERT INTO user_profiles (
      user_id,
      age,
      gender,
      language,
      address,
      blood_group,
      existing_conditions,
      allergies,
      bio
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  const values = [
    userId,
    age,
    validGender,
    JSON.stringify(Array.isArray(language) ? language : [language]),
    JSON.stringify(typeof address === "object" ? address : { text: address }),
    blood_group,
    JSON.stringify(Array.isArray(existing_conditions) ? existing_conditions : [existing_conditions]),
    JSON.stringify(Array.isArray(allergies) ? allergies : [allergies]),
    bio
  ];

  const [result] = await db.execute(sql, values);
  return result.insertId;
};



exports.getUserProfileByUserId = async (userId) => {
  const sql = `
    SELECT
      u.id AS user_id,
      u.full_name,
      u.email,
      u.phone_number,

      p.age,
      p.gender,
      p.language,
      p.address,
      p.blood_group,
      p.existing_conditions,
      p.allergies,
      p.bio,

      di.file_key AS doctor_image

    FROM users u
    LEFT JOIN user_profiles p
      ON u.id = p.user_id

    LEFT JOIN doctor_image di
      ON u.id = di.doctor_id  

    WHERE u.id = ?
    LIMIT 1
  `;

  const [rows] = await db.execute(sql, [userId]);
  return rows[0] || null;
};

