const DoctorRatingModel = require("../../models/doctorRatingModel");

const BASE_FILE_URL =
  process.env.APP_BASE_URL || "http://localhost:4000/uploads";

const buildQrUrl = (qrCode) => {
  if (!qrCode) return null;
  if (qrCode.startsWith("http") || qrCode.startsWith("data:")) {
    return qrCode;
  }

  if (qrCode.toLowerCase().endsWith(".png")) {
    return `${BASE_FILE_URL}/qr/${qrCode}`;
  }

  return `${BASE_FILE_URL}/qrcodes/${qrCode}.png`;
};

function parseJSON(value, fallback = []) {
  if (!value) return fallback;

  if (Array.isArray(value) || typeof value === "object") {
    return value;
  }

  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

exports.getDoctorProfileWithRating = async (doctorId) => {
  try {

    if (!Number.isInteger(doctorId) || doctorId <= 0) {
      return {
        success: false,
        statusCode: 400,
        message: "Valid doctorId is required"
      };
    }

    const doctor = await DoctorRatingModel.getDoctorWithRating(doctorId);

    if (!doctor) {
      return {
        success: false,
        statusCode: 404,
        message: "Doctor not found"
      };
    }

    let qrCode = null;

    if (doctor.qr_code) {
      qrCode = buildQrUrl(doctor.qr_code);
    }

    return {
      success: true,
      statusCode: 200,
      message: "Doctor profile fetched successfully.",
      data: {
        doctorId: doctor.id,
        userId: doctor.user_id,
        username: doctor.username,
        specialization: doctor.specialization,
        qualification: doctor.qualification,
        experience: Number(doctor.experience || 0),
        consultationFee: Number(doctor.consultation_fee || 0),
        medicalLicenseNo: doctor.medical_license_no,
        bio: doctor.bio,
        age: doctor.age,
        gender: doctor.gender,

        language: parseJSON(doctor.language),

        availability: parseJSON(doctor.availability),

        hospitalDetail: parseJSON(doctor.hospital_detail),

        averageRating: Number(doctor.avg_rating || 0).toFixed(1),

        totalRatings: Number(doctor.total_ratings || 0),

        positiveFeedbacks: Number(doctor.positive_feedbacks || 0),

        negativeFeedbacks: Number(doctor.negative_feedbacks || 0),

        qrCode
      }
    };

  } catch (error) {

    console.error(
      "GET DOCTOR PROFILE WITH RATING SERVICE ERROR:",
      error
    );

    return {
      success: false,
      statusCode: 500,
      message: "Internal Server Error"
    };
  }
};