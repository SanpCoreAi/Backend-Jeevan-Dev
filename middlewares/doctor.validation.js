exports.validateDoctorProfile = (req, res, next) => {
  const {
    specialization,
    start_time,
    end_time,
  } = req.body;

  /* ================= REQUIRED FIELDS ================= */

  if (!specialization || specialization.trim() === "") {
    return res.status(400).json({
      success: false,
      statusCode: 400,
      message: "Specialization is required",
    });
  }

  /* ================= TIME VALIDATION ================= */

  // Agar ek time diya hai aur dusra nahi
  if ((start_time && !end_time) || (!start_time && end_time)) {
    return res.status(400).json({
      success: false,
      statusCode: 400,
      message: "Both start_time and end_time are required",
    });
  }

  // Agar dono aaye hain to format check karo
  if (start_time && end_time) {
    const timeRegex = /^([01]\d|2[0-3]):([0-5]\d):([0-5]\d)$/;

    if (!timeRegex.test(start_time) || !timeRegex.test(end_time)) {
      return res.status(400).json({
        success: false,
        statusCode: 400,
        message: "Time must be in HH:MM:SS format",
      });
    }

    if (start_time >= end_time) {
      return res.status(400).json({
        success: false,
        statusCode: 400,
        message: "start_time must be earlier than end_time",
      });
    }
  }

  next();
};
