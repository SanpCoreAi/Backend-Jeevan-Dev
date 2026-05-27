const db = require("../config/db");

async function updateDoctorLicense(doctorId, licenseFile) {
  try {
    if (!doctorId) {
      const err = new Error("Doctor ID is required");
      err.statusCode = 400;
      throw err;
    }

    if (!licenseFile) {
      const err = new Error("License file is missing");
      err.statusCode = 400;
      throw err;
    }

    // Update using doctor_id (which is the user.id), not id
    const [result] = await db.query(
      `UPDATE doctors SET license_file = ? WHERE doctor_id = ?`,
      [licenseFile, doctorId]
    );

    if (result.affectedRows === 0) {
      const err = new Error("Doctor not found or update failed");
      err.statusCode = 404;
      throw err;
    }

    return { doctorId, licenseFile };

  } catch (err) {
    console.error("[Model Error updateDoctorLicense]:", err);

    if (!err.statusCode) {
      err.statusCode = 500;
      err.message = "Database error while updating license file";
    }

    throw err;
  }
}

module.exports = { updateDoctorLicense };
