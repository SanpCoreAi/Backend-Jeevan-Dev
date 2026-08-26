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

    if (
      !Number.isInteger(doctorId) ||
      doctorId <= 0
    ) {
      return {
        success: false,
        statusCode: 400,
        message: "Valid doctorId is required"
      };
    }

    const doctor =
      await DoctorRatingModel.getDoctorWithRating(
        doctorId
      );

    if (!doctor) {
      return {
        success: false,
        statusCode: 404,
        message: "Doctor not found"
      };
    }

    let qrCode = null;

    if (doctor.qr_url) {
      qrCode = doctor.qr_url;
    }

    return {
      success: true,
      statusCode: 200,
      message:
        "Doctor profile fetched successfully.",

      data: {

        doctorId:
          doctor.doctor_id,

        userId:
          doctor.user_id,

        registrationId:
          doctor.registration_id,

        // doctor_registrations
        fullName:
          doctor.full_name || "",

        gender:
          doctor.gender || "",

        age:
          Number(doctor.age || 0),

        email:
          doctor.email || "",

        phoneNumber:
          doctor.mobile || "",

        medicalRegistrationNumber:
          doctor.medical_registration_number || "",

        medicalCouncil:
          doctor.medical_council || "",

        qualification:
          doctor.qualification || "",

        specialization:
          doctor.specialization || "",

        onboardingStatus:
          doctor.onboarding_status || "",

        selfie:
          doctor.selfie || null,

        // doctors
        experience:
          Number(
            doctor.experience || 0
          ),

        language:
          parseJSON(
            doctor.language
          ),

        consultationFee:
          Number(
            doctor.consultation_fee || 0
          ),

        bio:
          doctor.bio || "",

        availability:
          parseJSON(
            doctor.availability
          ),

        hospitalDetail:
          parseJSON(
            doctor.hospital_detail
          ),

        qrCode,

        acceptEmergencyPatients:
          doctor.accept_emergency_patients,

        // ratings
        averageRating:
          Number(
            doctor.avg_rating || 0
          ).toFixed(1),

        totalRatings:
          Number(
            doctor.total_ratings || 0
          ),

        positiveFeedbacks:
          Number(
            doctor.positive_feedbacks || 0
          ),

        negativeFeedbacks:
          Number(
            doctor.negative_feedbacks || 0
          )
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
      message:
        "Internal Server Error"
    };
  }
};