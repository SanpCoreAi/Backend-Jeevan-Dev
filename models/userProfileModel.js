const db = require("../config/db");


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

const formatValue = (key, value) => {

  if (value === undefined || value === null) {
    return null;
  }

  if (jsonFields.includes(key)) {
    return JSON.stringify(value);
  }

  return value;
};

exports.getUserProfileByUserId = async (userId) => {

  const [rows] = await db.execute(
    `
    SELECT *
    FROM user_profiles
    WHERE user_id = ?
    LIMIT 1
    `,
    [userId]
  );

  return rows.length ? rows[0] : null;
};

exports.createUserProfile = async (
  userId,
  body
) => {

  const columns = ["user_id"];
  const placeholders = ["?"];
  const values = [userId];

  Object.keys(body).forEach((key) => {

    if (!fieldMap[key]) return;

    columns.push(fieldMap[key]);
    placeholders.push("?");

    values.push(
      formatValue(key, body[key])
    );

  });

  const sql = `
    INSERT INTO user_profiles
    (${columns.join(",")})
    VALUES
    (${placeholders.join(",")})
  `;

  const [result] =
    await db.execute(sql, values);
  return result.insertId || (result.affectedRows > 0);
};

exports.updateUserProfile = async (
  userId,
  body
) => {

  const updates = [];
  const values = [];

  Object.keys(body).forEach((key) => {

    if (!fieldMap[key]) return;

    updates.push(
      `${fieldMap[key]}=?`
    );

    values.push(
      formatValue(key, body[key])
    );

  });

  if (updates.length === 0) {
    return false;
  }

  values.push(userId);

  const sql = `
    UPDATE user_profiles
    SET
      ${updates.join(",")},
      updated_at = CURRENT_TIMESTAMP
    WHERE user_id = ?
  `;

  const [result] =
    await db.execute(sql, values);

  return result.affectedRows > 0;
};

exports.getUserProfileByUserIds =
async (userId) => {

  const [rows] =
    await db.execute(

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

(
SELECT file_key
FROM user_images
WHERE user_id=u.id
ORDER BY id DESC
LIMIT 1
) AS image_key

FROM users u

LEFT JOIN user_profiles p
ON p.user_id=u.id

WHERE u.id=?

LIMIT 1
`,
[userId]

);

return rows.length
? rows[0]
: null;

};

exports.getUserProfileByUserIds =
async (userId) => {

const [rows] =
await db.execute(

`
SELECT

u.id user_id,
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

(
SELECT file_key
FROM user_images
WHERE user_id=u.id
ORDER BY id DESC
LIMIT 1
) image_key

FROM users u

LEFT JOIN user_profiles p
ON p.user_id=u.id

WHERE u.id=?

LIMIT 1
`,
[userId]

);

return rows[0] || null;

};

exports.checkDoctorPatientRelation =
async (
doctorId,
patientId
)=>{

const [rows]=
await db.execute(

`
SELECT id

FROM appointments

WHERE doctor_id=?
AND patient_id=?

LIMIT 1
`,

[
doctorId,
patientId
]

);

return rows.length>0;

};

exports.getPatientCardProfile =
async(patientId)=>{

const [rows]=
await db.execute(

`
SELECT

u.id patient_id,
u.full_name,
u.phone_number,

p.age,
p.gender,
p.weight,
p.height,

(
SELECT
DATE_FORMAT(
created_at,
'%d-%m-%Y %h:%i %p'
)

FROM appointments

WHERE patient_id=u.id

ORDER BY created_at DESC

LIMIT 1

) last_appointment

FROM users u

LEFT JOIN user_profiles p
ON p.user_id=u.id

WHERE u.id=?

LIMIT 1
`,

[patientId]

);

return rows[0] || null;

};

exports.getPatientDetails =
async(
doctorId,
appointmentId
)=>{

const [rows]=
await db.execute(

`
SELECT

u.id user_id,
u.full_name,
u.email,
u.phone_number,

up.age,
up.gender,
up.weight,
up.height,
up.blood_group,

a.id appointment_id,
a.slot_date,
a.status,
a.reason_for_visit,
a.hospital_name

FROM appointments a

INNER JOIN users u
ON u.id=a.patient_id

LEFT JOIN user_profiles up
ON up.user_id=a.patient_id

WHERE
a.id=?
AND a.doctor_id=?

LIMIT 1
`,

[
appointmentId,
doctorId
]

);

return rows[0] || null;

};

exports.getAllUsers =
async()=>{

const [rows]=
await db.execute(

`
SELECT

u.id user_id,
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
p.emergency_contact

FROM users u

LEFT JOIN user_profiles p
ON p.user_id=u.id

WHERE u.role_id=1

ORDER BY u.id DESC
`

);

return rows;

};