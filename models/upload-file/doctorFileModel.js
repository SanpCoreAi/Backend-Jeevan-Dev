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

  return {
    id: result.insertId,
    doctorId,
    fileKey,
    folderName,
  };
};

const findByDoctorId = async (doctorId, folderName = null) => {
  let sql = `
    SELECT
      id,
      doctor_id,
      file_key,
      folder_name,
      created_at
    FROM doctor_files
    WHERE doctor_id = ?
  `;

  const params = [doctorId];

  if (folderName) {
    sql += ` AND folder_name = ?`;
    params.push(folderName);
  }

  sql += ` ORDER BY created_at DESC`;

  const [rows] = await db.execute(sql, params);

  console.log("Rows:", rows);

  return rows.map((row) => ({
    id: row.id,
    doctorId: row.doctor_id,
    fileKey: row.file_key,
    folderName: row.folder_name,
    fileUrl: `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${row.file_key}`,
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
      created_at
    FROM doctor_files
    WHERE id = ?
    LIMIT 1
  `;

  const [rows] = await db.execute(sql, [id]);

  return rows.length ? rows[0] : null;
};

const softDelete = async (id) => {
  const sql = `
    UPDATE doctor_files
    SET deleted_at = NOW()
    WHERE id = ?
      AND deleted_at IS NULL
  `;

  const [result] = await db.execute(sql, [id]);

  return result.affectedRows > 0;
};

module.exports = {
  create,
  findByDoctorId,
  findById,
  softDelete,
};