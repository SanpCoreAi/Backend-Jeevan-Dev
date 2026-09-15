const db = require("../../config/db");

const create = async ({
  doctorId,
  fileKey,
  folderName,
}) => {
  const sql = `
    INSERT INTO doctor_files
    (
      doctor_id,
      file_key,
      folder_name
    )
    VALUES (?, ?, ?)
  `;

  const [result] = await db.execute(sql, [
    doctorId,
    fileKey,
    folderName,
  ]);

  return result;
};

const findByDoctorId = async (
  doctorId,
  folderName = null
) => {
  let sql = `
    SELECT
      id,
      doctor_id,
      file_key,
      folder_name,
      created_at
    FROM doctor_files
    WHERE doctor_id = ?
      AND status = 'ACTIVE'
  `;

  const params = [doctorId];

  if (folderName) {
    sql += ` AND folder_name = ?`;
    params.push(folderName);
  }

  sql += ` ORDER BY created_at DESC`;

  const [rows] = await db.execute(sql, params);

  return rows.map((row) => ({
    id: row.id,
    doctorId: row.doctor_id,
    fileKey: row.file_key,
    folderName: row.folder_name,
    createdAt: row.created_at,
  }));
};

const findById = async (id) => {
  const sql = `
    SELECT
      id,
      doctor_id,
      file_key,
      folder_name,
      status,
      created_at
    FROM doctor_files
    WHERE id = ?
      AND status = 'ACTIVE'
    LIMIT 1
  `;

  const [rows] = await db.execute(sql, [id]);

  return rows.length
    ? {
        id: rows[0].id,
        doctorId: rows[0].doctor_id,
        fileKey: rows[0].file_key,
        folderName: rows[0].folder_name,
        status: rows[0].status,
        createdAt: rows[0].created_at
      }
    : null;
};

const softDelete = async (id) => {
  const sql = `
    UPDATE doctor_files
    SET status = 'INACTIVE'
    WHERE id = ?
      AND status = 'ACTIVE'
  `;

  const [result] = await db.execute(sql, [id]);

  return result.affectedRows > 0;
};

module.exports = {
  create,
  findByDoctorId,
  findById,
  softDelete
};