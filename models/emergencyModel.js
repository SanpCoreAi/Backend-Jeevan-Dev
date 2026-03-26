const  db = require("../config/db");
const AppError = require("../utils/appError");

exports.findTargetUser = async (doctor_id, role_id) => {
  try {
    let query;
    let params;

    if (role_id === 2) {
      query = `SELECT id FROM users WHERE doctor_id = ?`;
      params = [doctor_id];
    } 
    else if (role_id === 3) {
      query = `SELECT doctor_id AS id FROM users WHERE id = ?`;
      params = [doctor_id];
    } 
    else {
      throw new AppError("Invalid role. Only doctor or assistant can send emergency.", 400);
    }

    const [rows] = await db.query(query, params);
    const targetIds = rows.map(r => r.id).filter(Boolean);

    if (role_id === 3 && targetIds.length === 0) {
      throw new AppError(
        "No doctor assigned to this assistant. Cannot send emergency.",
        404
      );
    }

    return targetIds;

  } catch (err) {
    console.error(" Error in findTargetUser:", err.message);
    throw err instanceof AppError ? err : new AppError("DB Error in target user lookup", 500);
  }
};

exports.insertEmergency = async (doctor_id, role_id, target_doctor_id, message) => {
  const query = `
    INSERT INTO emergency_requests (doctor_id, role_id, target_doctor_id, message, created_at)
    VALUES (?, ?, ?, ?, NOW())
  `;
  const [result] = await db.query(query, [doctor_id, role_id, target_doctor_id, message]);
  return result.insertId;
};

exports.getEmergenciesByUser = async (doctor_id) => {
  const query = `
    SELECT * FROM emergency_requests
    WHERE doctor_id = ? OR target_doctor_id = ?
    ORDER BY created_at DESC
  `;
  const [rows] = await db.query(query, [doctor_id, doctor_id]);
  return rows;
};