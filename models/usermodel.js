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
       "status",
    ];

    const fields = [];
    const values = [];

    for (const field of allowedFields) {

      if (field === "doctor_id") {

        if (data.doctor_id) {
          fields.push(field);
          values.push(data.doctor_id);
        }

        continue;
      }

      if (
        data[field] !== undefined &&
        data[field] !== null
      ) {
        fields.push(field);
        values.push(data[field]);
      }
    }

    const placeholders = fields
      .map(() => "?")
      .join(", ");

    const sql = `
      INSERT INTO users
      (${fields.join(", ")})
      VALUES
      (${placeholders})
    `;

    const [result] = await db.query(sql, values);

    return result.insertId;

  } catch (error) {

    console.error("Create User Model Error:", error);
    throw error;

  }
};


exports.findByEmail = async (email) => {
  try {

    const [rows] = await db.query(
      `
      SELECT *
      FROM users
      WHERE email = ?
      LIMIT 1
      `,
      [email]
    );

    return rows[0] || null;

  } catch (error) {

    console.error("Find By Email Model Error:", error);
    throw error;

  }
};

exports.findByPhone = async (phoneNumber) => {
  try {

    const [rows] = await db.query(
      `
      SELECT *
      FROM users
      WHERE phone_number = ?
      LIMIT 1
      `,
      [phoneNumber]
    );

    return rows[0] || null;

  } catch (error) {

    console.error("Find By Phone Model Error:", error);
    throw error;

  }
};

exports.findById = async (id) => {
  try {

    const [rows] = await db.query(
      `
      SELECT
        id,
        full_name,
        email,
        phone_number,
        doctor_id,
        role_id,
        password,
        email_verified
      FROM users
      WHERE id = ?
      LIMIT 1
      `,

      [id]
    );
    return rows[0] || null;
  } catch (error) {

    console.error("Find By Id Model Error:", error);
    throw error;

  }
};

exports.verifyUserByToken = async (token) => {
  try {

    const [rows] = await db.query(
      `
      SELECT
        id,
        email,
        email_verified,
        verificationToken
      FROM users
      WHERE verificationToken = ?
      LIMIT 1
      `,
      [token]
    );

    return rows[0] || null;

  } catch (error) {

    console.error("Verify User By Token Model Error:", error);
    throw error;

  }
};

exports.markEmailVerified = async (userId) => {
  try {

    const [result] = await db.query(
      `
      UPDATE users
      SET
        email_verified = 1,
        verificationToken = NULL
      WHERE id = ?
      `,
      [userId]
    );

    return result.affectedRows;

  } catch (error) {

    console.error("Mark Email Verified Model Error:", error);
    throw error;

  }
};

exports.updateVerificationToken = async (
  userId,
  verificationToken
) => {
  try {

    const [result] = await db.query(
      `
      UPDATE users
      SET
        verificationToken = ?
      WHERE id = ?
      `,
      [
        verificationToken,
        userId,
      ]
    );

    return result.affectedRows;

  } catch (error) {

    console.error("Update Verification Token Model Error:", error);
    throw error;

  }
};

exports.saveResetToken = async (
  userId,
  tokenHash,
  expiry
) => {
  try {

    const [result] = await db.query(
      `
      UPDATE users
      SET
        reset_token_hash = ?,
        reset_token_expiry = ?
      WHERE id = ?
      `,
      [
        tokenHash,
        expiry,
        userId,
      ]
    );

    return result.affectedRows;

  } catch (error) {

    console.error("Save Reset Token Model Error:", error);
    throw error;

  }
};

exports.findUserByResetToken = async (tokenHash) => {
  try {

    const [rows] = await db.query(
      `
      SELECT
        id,
        reset_token_expiry
      FROM users
      WHERE reset_token_hash = ?
      LIMIT 1
      `,
      [tokenHash]
    );

    return rows[0] || null;

  } catch (error) {

    console.error("Find Reset Token Model Error:", error);
    throw error;

  }
};

exports.updateRefreshToken = async (
  userId,
  refreshToken
) => {

  const [result] = await db.query(
    `
    UPDATE users
    SET refresh_token = ?
    WHERE id = ?
    `,
    [
      refreshToken,
      userId,
    ]
  );

  return result.affectedRows;
};


exports.updatePassword = async (
  userId,
  password
) => {
  try {

    const [result] = await db.query(
      `
      UPDATE users
      SET
        password = ?
      WHERE id = ?
      `,
      [
        password,
        userId,
      ]
    );

    return result.affectedRows;

  } catch (error) {

    console.error("Update Password Model Error:", error);
    throw error;

  }
};


exports.clearResetToken = async (userId) => {
  try {

    const [result] = await db.query(
      `
      UPDATE users
      SET
        reset_token_hash = NULL,
        reset_token_expiry = NULL
      WHERE id = ?
      `,
      [userId]
    );

    return result.affectedRows;

  } catch (error) {

    console.error("Clear Reset Token Model Error:", error);
    throw error;

  }
};

exports.findByDoctorId = async (doctorId) => {
  try {
    const [rows] = await db.query(
      `
      SELECT
        u.id,
        u.full_name,
        u.email,
        u.phone_number,
        u.role_id,
        u.email_verified,
        u.created_at,

        -- Assistant Profile
        ap.gender,
        ap.age,
        ap.department,
        ap.education,
        ap.experience,
        ap.language,
        ap.address,
        ap.bio,

        -- User Image
        ui.file_key AS image,
        ui.folder_name

      FROM users u

      LEFT JOIN assistant_profiles ap
        ON ap.user_id = u.id

      LEFT JOIN user_images ui
        ON ui.user_id = u.id

      WHERE u.doctor_id = ?

      ORDER BY u.created_at DESC
      `,
      [doctorId]
    );

    return rows;

  } catch (error) {
    console.error("Find By Doctor Id Model Error:", error);
    throw error;
  }
};

exports.findUsers = async (
  filters = {},
  limit = 10,
  offset = 0
) => {
  try {

    let where = " WHERE 1=1 ";
    const params = [];

    if (filters.doctor_id) {
      where += " AND doctor_id = ?";
      params.push(filters.doctor_id);
    }

    if (filters.role_id) {
      where += " AND role_id = ?";
      params.push(filters.role_id);
    }

    if (filters.email_verified !== undefined) {
      where += " AND email_verified = ?";
      params.push(filters.email_verified);
    }

    if (filters.email) {
      where += " AND email LIKE ?";
      params.push(`%${filters.email}%`);
    }

    if (filters.name) {
      where += " AND full_name LIKE ?";
      params.push(`%${filters.name}%`);
    }

    const [countRows] = await db.query(
      `
      SELECT COUNT(*) AS total
      FROM users
      ${where}
      `,
      params
    );


    const [rows] = await db.query(
      `
      SELECT
        id,
        full_name,
        email,
        phone_number,
        doctor_id,
        role_id,
        email_verified,
        created_at
      FROM users
      ${where}
      ORDER BY id DESC
      LIMIT ?
      OFFSET ?
      `,
      [...params, limit, offset]
    );

    return {
      total: countRows[0].total,
      users: rows,
    };

  } catch (error) {

    console.error("Find Users Model Error:", error);
    throw error;

  }
};

exports.getAssistantStats = async (doctorId) => {
  try {

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
            WHEN YEAR(created_at) = YEAR(CURDATE())
            AND MONTH(created_at) = MONTH(CURDATE())
            THEN 1
          END
        ) AS monthAssistants,

        COUNT(
          CASE
            WHEN YEARWEEK(created_at,1)=YEARWEEK(CURDATE(),1)
            THEN 1
          END
        ) AS weekAssistants

      FROM users

      WHERE doctor_id = ?
      AND role_id = 3
      `,
      [doctorId]
    );

    return rows[0];

  } catch (error) {

    console.error("Assistant Stats Model Error:", error);
    throw error;

  }
};