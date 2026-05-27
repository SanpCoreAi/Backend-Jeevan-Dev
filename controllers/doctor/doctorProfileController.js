const db = require("../../config/db");


exports.getOrCreateDoctorProfile = async (req, res) => {
  try {
    const { id } = req.params;

    const [userRows] = await db.query(
      "SELECT id, full_name, email, phone_number, role_id FROM users WHERE id = ?",
      [id]
    );

    if (userRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const userData = userRows[0];

    const [doctorRows] = await db.query(
      "SELECT * FROM doctors WHERE doctor_id = ?",
      [id]
    );

    const doctorData = doctorRows[0] || null;

    return res.status(200).json({
      success: true,
      data: {
        user: {
          id: userData.id,
          full_name: userData.full_name,
          email: userData.email,
          phone_number: userData.phone_number,
          role_id: userData.role_id,
        },
        doctor: doctorData,
        exists: doctorData !== null,
      },
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error,
    });
  }
};
