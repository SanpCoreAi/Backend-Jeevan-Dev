const jwt = require("jsonwebtoken");

const generateDoctorToken = (doctor) => {
  const payload = {
    id: doctor.id,
    role: doctor.role || "doctor",
  };

  const token = jwt.sign(
    payload,
    process.env.JWT_SECRET || "MY_SUPER_SECRET_KEY",
    { expiresIn: "1h" }
  );

  return token;
};

module.exports = { generateDoctorToken };
