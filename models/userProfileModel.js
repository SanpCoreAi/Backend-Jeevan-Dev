const db = require("../config/db");

exports.createUserProfile = async (userId, data = {}) => {
  const {
    age = null,
    gender = null,
    language = [],
    address = {},
    blood_group = null,
    weight = null,     
    height = null,    
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
      weight,
      height,
      existing_conditions,
      allergies,
      bio
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  const values = [
    userId,
    age,
    validGender,
    JSON.stringify(Array.isArray(language) ? language : [language]),
    JSON.stringify(typeof address === "object" ? address : { text: address }),
    blood_group,
    weight,   // ✅ added
    height,   // ✅ added
    JSON.stringify(Array.isArray(existing_conditions) ? existing_conditions : [existing_conditions]),
    JSON.stringify(Array.isArray(allergies) ? allergies : [allergies]),
    bio
  ];

  const [result] = await db.execute(sql, values);
  return result.insertId;
};

exports.getPatientDetails = async (patientId) => {
  const sql = `
    SELECT 
      u.id AS patient_id,
      u.full_name AS name,
      u.email,
      u.phone_number AS phone,

      up.age,
      up.gender,
      up.blood_group,
      up.height,
      up.allergies,
      up.existing_conditions,
      up.weight,
      up.created_at,

      a.slot_date AS last_appointment,
      a.appointment_type,
      a.booking_type,
      a.id AS appointment_id

    FROM users u
    LEFT JOIN user_profiles up ON u.id = up.user_id
    LEFT JOIN appointments a ON u.id = a.patient_id

    WHERE u.id = ?
    ORDER BY a.slot_date IS NULL, a.slot_date DESC
    LIMIT 1
  `;

  const [rows] = await db.execute(sql, [patientId]);

  return rows;
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
    LEFT JOIN user_profiles p ON u.id = p.user_id
    LEFT JOIN doctor_image di ON u.id = di.doctor_id  

    WHERE u.id = ?
    LIMIT 1
  `;

  const [rows] = await db.execute(sql, [userId]);

  return rows.length ? rows[0] : null;
};