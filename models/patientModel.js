const db = require("../config/db");

async function findPatientByEmailOrMobile(email, mobile) {
  const [rows] = await db.query(
    "SELECT * FROM patients WHERE email_address = ? OR mobile_number = ? LIMIT 1",
    [email, mobile]
  );
  return rows[0];
}

async function createPatient(data) {
  const sql = `
    INSERT INTO patients 
    (full_name, age, mobile_number, gender, email_address, area, pin_code)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `;
  const [result] = await db.query(sql, [
    data.full_name,
    data.age,
    data.mobile_number,
    data.gender,
    data.email_address,
    data.area,
    data.pin_code,
  ]);
  return { id: result.insertId, ...data };
}

module.exports = { findPatientByEmailOrMobile, createPatient };