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



exports.getAssistantProfile = async(userId)=>{


const [rows] = await db.query(

`
SELECT

ap.id,
ap.gender,
ap.age,
ap.department,
ap.education,
ap.experience,
ap.language,
ap.address,
ap.bio,

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





exports.getAllAssistantProfiles = async(userId)=>{


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

`,

[userId]

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