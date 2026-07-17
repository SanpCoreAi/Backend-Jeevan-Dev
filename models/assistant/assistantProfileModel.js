const db = require("../../config/db");


exports.createAssistantProfile = async (data) => {

  const {
    user_id,
    gender,
    age,
    department,
    education,
    experience,
    language,
    address,
    bio
  } = data;


  const [result] = await db.query(
    `
    INSERT INTO assistant_profiles
    (
      user_id,
      gender,
      age,
      department,
      education,
      experience,
      language,
      address,
      bio
    )
    VALUES (?,?,?,?,?,?,?,?,?)
    `,
    [
      user_id,
      gender,
      age,
      department,
      education,
      experience,
      JSON.stringify(language || []),
      JSON.stringify(address || {}),
      bio
    ]
  );


  return result.insertId;
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

exports.updateAssistantProfile = async (
  userId,
  data
) => {


  const {
    gender,
    age,
    department,
    education,
    experience,
    language,
    address,
    bio
  } = data;



  const [result] = await db.query(

`
UPDATE assistant_profiles
SET

gender = ?,
age = ?,
department = ?,
education = ?,
experience = ?,
language = ?,
address = ?,
bio = ?

WHERE user_id = ?

`,

[

gender,
age,
department,
education,
experience,

JSON.stringify(language || []),

JSON.stringify(address || {}),

bio,

userId

]

);



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