const db = require("../config/db");

exports.createUser = async (data) => {
  try {

    const allowedFields = [
      "full_name",
      "email",
      "phone_number",
      "password",
      "doctor_id",
      "role_id",
      "verificationToken",
      "email_verified",
    ];

    const fields = [];
    const values = [];

    allowedFields.forEach((key) => {

      if (
        data[key] !== undefined &&
        data[key] !== null
      ) {
        fields.push(key);
        values.push(data[key]);
      }

    });

    if (fields.length === 0) {
      throw new Error("No valid fields provided");
    }

    const placeholders = fields
      .map(() => "?")
      .join(", ");

    const sql = `
      INSERT INTO users (${fields.join(", ")})
      VALUES (${placeholders})
    `;

    const [result] = await db.query(sql, values);

    return result.insertId;

  } catch (error) {

    console.error(
      "DB Error (createUser):",
      error.message
    );

    throw error;
  }
};

exports.findByEmail = async (email) => {

  const [rows] = await db.query(
    "SELECT * FROM users WHERE email = ?",
    [email]
  );

  return rows[0] || null;
};

exports.findByPhone = async (phone_number) => {

  const [rows] = await db.query(
    "SELECT * FROM users WHERE phone_number = ?",
    [phone_number]
  );

  return rows[0] || null;
};

exports.findByDoctorId = async (doctor_id) => {

  const [rows] = await db.query(
    `
    SELECT 
      id,
      full_name,
      email,
      phone_number
     
    FROM users
    WHERE doctor_id = ?
    `,
    [doctor_id]
  );

  return rows;
};

exports.verifyUserByToken = async (token) => {

  const [rows] = await db.query(
    `
    SELECT *
    FROM users
    WHERE verificationToken = ?
    `,
    [token]
  );

  return rows[0] || null;
};

exports.markEmailVerified = async (id) => {

  await db.query(
    `
    UPDATE users
    SET
      email_verified = 1,
      verificationToken = NULL
    WHERE id = ?
    `,
    [id]
  );
};

exports.saveResetToken=async(
userId,
tokenHash,
expiry
)=>{


const [result]=await db.query(

`
UPDATE users
SET 
reset_token_hash=?,
reset_token_expiry=?
WHERE id=?
`,

[
tokenHash,
expiry,
userId
]

);


return result;

};

exports.findUsers = async (
  filters = {},
  limit = 10,
  offset = 0
) => {

  try {

    let sql = `
      SELECT
        id,
        full_name,
        email,
        phone_number,
        doctor_id,
        role_id,
        email_verified
      FROM users
      WHERE 1 = 1
    `;

    const params = [];

    Object.entries(filters).forEach(
      ([key, value]) => {

        if (!value && value !== 0) return;

        if (
          [
            "doctor_id",
            "role_id",
            "email_verified",
          ].includes(key)
        ) {
          sql += ` AND ${key} = ?`;
          params.push(value);
        }

        if (key === "email") {
          sql += ` AND email LIKE ?`;
          params.push(`%${value}%`);
        }

        if (key === "name") {
          sql += ` AND full_name LIKE ?`;
          params.push(`%${value}%`);
        }

      }
    );

    sql += ` LIMIT ? OFFSET ?`;

    params.push(limit, offset);

    const [rows] = await db.query(sql, params);

    return rows;

  } catch (error) {

    console.error(
      "DB Error (findUsers):",
      error.message
    );

    throw error;
  }
};

exports.findById = async(id)=>{

 const [rows] = await db.query(
   `
   SELECT id, doctor_id, role_id
   FROM users
   WHERE id=?
   `,
   [id]
 );

 return rows[0];

};

exports.findUserByResetToken=
async(token)=>{


const [rows]=await db.query(

`
SELECT 
id,
reset_token_expiry
FROM users
WHERE reset_token_hash=?
LIMIT 1
`,

[token]

);


return rows[0];

};

exports.updatePassword=
async(userId,password)=>{


const [result]=await db.query(

`
UPDATE users
SET password=?
WHERE id=?
`,

[
password,
userId
]

);


return result;

};

exports.clearResetToken=
async(userId)=>{


const [result]=await db.query(

`
UPDATE users
SET
reset_token_hash=NULL,
reset_token_expiry=NULL
WHERE id=?
`,

[userId]

);


return result;

};

exports.getAssistantStats = async (doctorId) => {
  const [rows] = await db.query(
    `
    SELECT
      COUNT(*) AS totalAssistants,

      COUNT(
        CASE
          WHEN YEAR(created_at) = YEAR(CURDATE())
          THEN 1
        END
      ) AS yearAssistants,

      COUNT(
        CASE
          WHEN YEARWEEK(created_at, 1) = YEARWEEK(CURDATE(), 1)
          THEN 1
        END
      ) AS weekAssistants,

      COUNT(
        CASE
          WHEN YEAR(created_at) = YEAR(CURDATE())
          AND MONTH(created_at) = MONTH(CURDATE())
          THEN 1
        END
      ) AS monthAssistants

    FROM users
    WHERE doctor_id = ?
      AND role_id = 3
    `,
    [doctorId]
  );

  return rows[0];
};