// models/qrModel.js
const db = require("../config/db");

async function findByQRCode(qrCode) {
  const [rows] = await db.execute(
    "SELECT * FROM qr_codes WHERE qr_code = ? LIMIT 1",
    [qrCode]
  );
  return rows[0] || null;
}

module.exports = { findByQRCode };
