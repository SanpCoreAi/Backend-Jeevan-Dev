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