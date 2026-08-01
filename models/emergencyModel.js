const db = require("../config/db");

exports.findTargetUser = async (
  doctor_id,
  role_id
) => {

  let query = "";
  let params = [];

  if (role_id === 2) {

    query = `
      SELECT id
      FROM users
      WHERE doctor_id = ?
    `;

    params = [doctor_id];

  } else if (role_id === 3) {

    query = `
      SELECT doctor_id AS id
      FROM users
      WHERE id = ?
    `;

    params = [doctor_id];

  } else {

    return [];

  }

  const [rows] = await db.execute(
    query,
    params
  );

  return rows.map(row => row.id);

};

exports.insertEmergency = async (
  doctor_id,
  role_id,
  target_user_id,
  message
) => {

  const sql = `
    INSERT INTO emergency_requests
    (
      doctor_id,
      role_id,
      target_doctor_id,
      message,
      created_at
    )
    VALUES
    (?, ?, ?, ?, NOW())
  `;

  const [result] = await db.execute(
    sql,
    [
      doctor_id,
      role_id,
      target_user_id,
      message
    ]
  );

  return result.insertId;

};

exports.getEmergenciesByUser = async (
  doctor_id
) => {

  const sql = `
    SELECT
      id,
      doctor_id,
      role_id,
      target_doctor_id,
      message,
      created_at

    FROM emergency_requests

    WHERE
      doctor_id = ?
      OR target_doctor_id = ?

    ORDER BY created_at DESC
  `;

  const [rows] = await db.execute(
    sql,
    [
      doctor_id,
      doctor_id
    ]
  );

  return rows;

};