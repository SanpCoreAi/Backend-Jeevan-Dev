const db = require("../../config/db");

exports.createAssistantProfile = async(data)=>{


const {

user_id,
doctor_id,
gender,
dob,
joining_date,
designation,
department,
education,
experience,
language,
address,
bio

}=data;



const [result] =
await db.query(

`
INSERT INTO assistant_profiles
(
user_id,
doctor_id,
gender,
dob,
joining_date,
designation,
department,
education,
experience,
language,
address,
bio
)

VALUES (?,?,?,?,?,?,?,?,?,?,?,?)

`,

[

user_id,
doctor_id,
gender,
dob,
joining_date,
designation,
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

exports.getAssistantProfile = async(doctorId)=>{


const [rows] =
await db.query(

`

SELECT

ap.id,
ap.gender,
ap.dob,
ap.joining_date,
ap.designation,
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


WHERE ap.doctor_id = ?


ORDER BY ap.id DESC

LIMIT 1


`,

[doctorId]

);


return rows[0];

};





exports.getAllAssistantProfiles = async(doctorId)=>{


const [rows] =
await db.query(

`

SELECT

ap.*,

u.full_name,
u.email,
u.phone_number


FROM assistant_profiles ap


LEFT JOIN users u
ON u.id = ap.user_id


WHERE ap.doctor_id = ?


ORDER BY ap.id DESC


`,

[doctorId]

);


return rows;

};

exports.getOrphanProfileByDoctor = async (doctorId) => {
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
    WHERE ap.doctor_id = ?
      AND ap.user_id IS NULL
    ORDER BY ap.id DESC
    LIMIT 1
    `,
    [doctorId]
  );

  return rows[0];
};

