const db = require("../config/db");
const { validateUser } = require("../validation/auth/userValidator");

exports.createUser = async (data) => {
  try {
  
    const error = validateUser(data);
    if (error) throw new Error(error);

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

    for (const key of allowedFields) {
      if (data[key] !== undefined && data[key] !== null) {
        fields.push(key);
        values.push(data[key]);
      }
    }

    if (fields.length === 0) {
      throw new Error("No valid fields provided for user creation.");
    }

    const placeholders = fields.map(() => "?").join(", ");
    const sql = `INSERT INTO users (${fields.join(", ")}) VALUES (${placeholders})`;

    const [result] = await db.query(sql, values);
    return result.insertId;

  } catch (err) {
    console.error("Error (createUser):", err.message);
    throw new Error(err.message);
  }
};

exports.findByEmail = async (email) => {
  const [rows] = await db.query("SELECT * FROM users WHERE email = ?", [email]);
  return rows[0] || null;
};

exports.findByDoctorId = async (doctor_id) => {
  const [rows] = await db.query("SELECT * FROM users WHERE doctor_id = ?", [doctor_id]);
  return rows;
};

exports.findByPhone = async (phone_number) => {
  const [rows] = await db.query("SELECT * FROM users WHERE phone_number = ?", [phone_number]);
  return rows[0];
};

exports.verifyUserByToken = async (token) => {
  const [rows] = await db.query("SELECT * FROM users WHERE verificationToken = ?", [token]);
  return rows[0] || null;
};

exports.markEmailVerified = async (id) => {
  await db.query("UPDATE users SET email_verified = 1, verificationToken = NULL WHERE id = ?", [id]);
};

const findById = async (id) => {
  const [rows] = await db.query(
    "SELECT id, full_name, email, phone_number ,  refresh_token  FROM users WHERE id = ?",
    [id]
  );
  return rows[0];
};

// exports.findById = async (id) => {
//   const [rows] = await db.query(
//     `SELECT id, full_name, email, phone_number, age, gender FROM users WHERE id = ?`,
//     [id]
//   );
//   return rows[0];
// };

exports.findUsers = async (filters = {}) => {
  try {
    let sql = `
      SELECT id, full_name, email, phone_number, doctor_id, role_id, email_verified 
      FROM users WHERE 1=1
    `;
    const params = [];

    Object.entries(filters).forEach(([key, value]) => {
      if (!value && value !== 0) return;

      switch (key) {
        case "doctor_id":
        case "role_id":
          sql += ` AND ${key} = ?`;
          params.push(value);
          break;
        case "email":
          sql += " AND email LIKE ?";
          params.push(`%${value}%`);
          break;
        case "full_name":
        case "name":
          sql += " AND full_name LIKE ?";
          params.push(`%${value}%`);
          break;
        case "phone_number":
          sql += " AND phone_number LIKE ?";
          params.push(`%${value}%`);
          break;
        case "email_verified":
          sql += " AND email_verified = ?";
          params.push(value);
          break;
      }
    });

    const [rows] = await db.query(sql, params);
    return rows;

  } catch (err) {
    console.error("Database Error (findUsers):", err);
    throw new Error("Database query failed while fetching users.");
  }
};


exports.findById = findById;