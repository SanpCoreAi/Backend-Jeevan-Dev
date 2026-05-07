const db = require("../config/db");


exports.createUserProfile = async (userId, data) => {
  try {

    const {
      username,
      age = null,
      gender = null,
      dob = null,
      registration_date = null,
      language = [],
      address = {},
      blood_group = null,
      weight = null,
      height = null,
      existing_conditions = [],
      allergies = [],
      bio = null,
      emergency_contact = {}
    } = data;

    const [existing] = await db.execute(
      "SELECT user_id FROM user_profiles WHERE user_id = ?",
      [userId]
    );

    if (existing.length > 0) {
      return null;
    }

    const sql = `
      INSERT INTO user_profiles (
        user_id,
        username,
        age,
        gender,
        dob,
        registration_date,
        language,
        address,
        blood_group,
        weight,
        height,
        existing_conditions,
        allergies,
        bio,
        emergency_contact
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [
      userId,
      username,
      age,
      gender,
      dob,
      registration_date,
      JSON.stringify(language),
      JSON.stringify(address),
      blood_group,
      weight,
      height,
      JSON.stringify(existing_conditions),
      JSON.stringify(allergies),
      bio,
      JSON.stringify(emergency_contact)
    ];

    const [result] = await db.execute(sql, values);

    return {
      insertId: result.insertId
    };

  } catch (error) {
    console.error("DB Error:", error);
    throw error;
  }
};

exports.updateUserProfile = async (userId, data) => {
  const {
    username,
    age,
    gender,
    language,
    address,
    blood_group,
    weight,
    height,
    existing_conditions,
    allergies,
    bio,
    emergency_contact  
  } = data;

  const sql = `
    UPDATE user_profiles SET
      username = COALESCE(?, username),
      age = COALESCE(?, age),
      gender = COALESCE(?, gender),
      language = COALESCE(?, language),
      address = COALESCE(?, address),
      blood_group = COALESCE(?, blood_group),
      weight = COALESCE(?, weight),
      height = COALESCE(?, height),
      existing_conditions = COALESCE(?, existing_conditions),
      allergies = COALESCE(?, allergies),
      bio = COALESCE(?, bio),
       emergency_contact = COALESCE(?, emergency_contact) 
    WHERE user_id = ?
  `;

  const values = [
    username ?? null,
    age ?? null,
    gender ?? null,
    language ? JSON.stringify(language) : null,
    address ? JSON.stringify(address) : null,
    blood_group ?? null,
    weight ?? null,
    height ?? null,
    existing_conditions ? JSON.stringify(existing_conditions) : null,
    allergies ? JSON.stringify(allergies) : null,
    bio ?? null,
    emergency_contact ? JSON.stringify(emergency_contact) : null,
    userId
  ];

  const [result] = await db.execute(sql, values);

  return result.affectedRows > 0;
};

exports.getPatientCardProfile = async (userId) => {

  const sql = `
    SELECT 
      u.id AS patient_id,
      u.full_name,

      p.gender,
      p.weight,
      p.height,
      p.dob,
      p.registration_date

    FROM users u

    LEFT JOIN user_profiles p 
      ON u.id = p.user_id

    WHERE u.id = ?
    LIMIT 1
  `;

  const [rows] = await db.execute(sql, [userId]);

  return rows[0];
};

exports.getUserProfileByUserId = async (userId) => {
  const sql = `
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
      di.file_key AS doctor_image

    FROM users u
    LEFT JOIN user_profiles p ON u.id = p.user_id
    LEFT JOIN doctor_image di ON u.id = di.doctor_id  

    WHERE u.id = ?
    LIMIT 1
  `;

  const [rows] = await db.execute(sql, [userId]);
  return rows[0];
};