const DoctorModel = require("../../models/doctorModel");
const DoctorRegistrationModel = require("../../models/doctorVerification/doctorRegistrationModel");
const safeParse = require("../../utils/safeJson");
const QRCode = require("qrcode");
const path = require("path");
const fs = require("fs");

const BASE_FILE_URL = `${process.env.APP_BASE_URL}/uploads`;
const S3_BASE_URL = process.env.AWS_S3_BUCKET_URL;

const qrFolder = path.join(__dirname, "../../uploads/qr");

if (!fs.existsSync(qrFolder)) {
  fs.mkdirSync(qrFolder, { recursive: true });
}

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

const buildAddress = (hospital) => {
  if (!hospital) return null;

  return [
    hospital.flatPlotNo,
    hospital.buildingSociety,
    hospital.streetName,
    hospital.areaLocality,
    hospital.landmark,
    hospital.city,
    hospital.district,
    hospital.state,
    hospital.pinCode,
  ]
    .filter(Boolean)
    .join(", ");
};

exports.getProfile = async (userId) => {
  try {
    if (!Number.isInteger(userId) || userId <= 0) {
      return {
        success: false,
        statusCode: 400,
        message: "Valid user id is required.",
        data: null,
      };
    }

    const doctor =
      await DoctorModel.getBydoctorId(userId);

    if (!doctor) {
      return {
        success: false,
        statusCode: 404,
        message: "Doctor profile not found.",
        data: null,
      };
    }

    return {
      success: true,
      statusCode: 200,
      message: "Doctor profile fetched successfully.",

      data: {
        id: doctor.user_id,

        registration_id: doctor.registration_id,

        full_name: doctor.full_name,
        gender: doctor.gender,
        age: doctor.age,
        email: doctor.email,
        mobile: doctor.mobile,

        medical_registration_number:
          doctor.medical_registration_number,

        medical_council:
          doctor.medical_council,

        qualification:
          doctor.qualification,

        specialization:
          doctor.specialization,

        registration_expiry_date:
          doctor.registration_expiry_date,

        onboarding_status:
          doctor.onboarding_status,

        medical_registration_certificate:
          doctor.medical_registration_certificate,

        medical_degree_certificate:
          doctor.medical_degree_certificate,

        government_id_proof:
          doctor.government_id_proof,

        selfie:
          doctor.selfie,

        experience:
          doctor.experience,

        language:
          safeParse(doctor.language, []),

        consultation_fee:
          doctor.consultation_fee,

        bio:
          doctor.bio,

        availability:
          safeParse(doctor.availability, []),

        hospital_detail:
          safeParse(
            doctor.hospital_detail,
            []
          ),

        qr_url:
          doctor.qr_url || null,

        accept_emergency_patients:
          doctor.accept_emergency_patients,
      },
    };

  } catch (error) {

    console.error(
      "GET DOCTOR PROFILE SERVICE ERROR:",
      error
    );

    return {
      success: false,
      statusCode: 500,
      message: "Internal Server Error",
      data: null,
    };
  }
};

exports.getDoctorPublicProfileById = async (userId) => {
  try {
    if (!Number.isInteger(userId) || userId <= 0) {
      return {
        success: false,
        statusCode: 400,
        message: "Valid user id is required.",
      };
    }

    const doctor =
      await DoctorModel.getDoctorPublicProfileById(userId);

    if (!doctor) {
      return {
        success: false,
        statusCode: 404,
        message: "Doctor not found.",
      };
    }

    return {
      success: true,
      statusCode: 200,
      message: "Doctor profile fetched successfully.",

      data: {
        // doctor_registrations
        full_name: doctor.full_name,
        gender: doctor.gender,
        age: doctor.age,
        email: doctor.email,
        mobile: doctor.mobile,
        medical_registration_number:
          doctor.medical_registration_number,
        medical_council:
          doctor.medical_council,
        qualification:
          doctor.qualification,
        specialization:
          doctor.specialization,
        selfie:
          doctor.selfie || null,

        // doctors
        experience:
          doctor.experience,
        language:
          safeParse(doctor.language, []),
        consultation_fee:
          doctor.consultation_fee,
        bio:
          doctor.bio,
        availability:
          safeParse(doctor.availability, []),
        hospital_detail:
          safeParse(doctor.hospital_detail, []),
        qr_url:
          doctor.qr_url || null,
        accept_emergency_patients:
          doctor.accept_emergency_patients,

        // ratings
        avgRating:
          doctor.avg_rating == null
            ? "0.0"
            : Number(doctor.avg_rating).toFixed(1),

        totalFeedbacks:
          Number(doctor.total_feedbacks ?? 0),

        totalRatings:
          Number(doctor.total_ratings ?? 0),
      },
    };

  } catch (error) {

    console.error(
      "GET DOCTOR PUBLIC PROFILE SERVICE ERROR:",
      error
    );

    return {
      success: false,
      statusCode: 500,
      message: "Internal Server Error",
    };
  }
};

exports.updateProfile = async (userId, body) => {
  try {
    if (!Number.isInteger(userId) || userId <= 0) {
      return {
        success: false,
        statusCode: 401,
        message: "Unauthorized user.",
      };
    }

    if (
      !body ||
      typeof body !== "object" ||
      Object.keys(body).length === 0
    ) {
      return {
        success: false,
        statusCode: 400,
        message: "At least one field is required.",
      };
    }

    const doctor = await DoctorModel.getDoctorByUserId(userId);

    if (body.medicalLicenseNo) {
      const existingDoctor =
        await DoctorModel.getDoctorByMedicalLicenseNo(
          body.medicalLicenseNo
        );

      if (
        existingDoctor &&
        Number(existingDoctor.user_id) !== Number(userId)
      ) {
        return {
          success: false,
          statusCode: 409,
          message: "Medical license number already exists.",
        };
      }
    }

    if (!doctor) {
      const result = await DoctorModel.createDoctor(
        userId,
        body
      );

      if (body.registrationId) {
        await DoctorRegistrationModel.updateOnboardingStatus(
          body.registrationId,
          "VERIFIED"
        );
      }

      return {
        success: true,
        statusCode: 201,
        message: "Doctor profile created successfully.",
      };
    }

    const result = await DoctorModel.updateDoctor(
      userId,
      body
    );

    if (!result || result.affectedRows === 0) {
      return {
        success: false,
        statusCode: 400,
        message: "Doctor profile update failed.",
      };
    }

    if (body.registrationId) {
      await DoctorRegistrationModel.updateOnboardingStatus(
        body.registrationId,
        "VERIFIED"
      );
    }

    return {
      success: true,
      statusCode: 200,
      message: "Doctor profile updated successfully.",
    };

  } catch (error) {
    console.error(
      "UPDATE DOCTOR PROFILE SERVICE ERROR:",
      error
    );

    return {
      success: false,
      statusCode: 500,
      message: "Internal Server Error",
    };
  }
};

exports.getAllDoctors = async ({
  page = 1,
  limit = 10,
  search = "",
} = {}) => {
  try {

    const safePage = Math.max(
      1,
      Number.parseInt(page, 10) || 1
    );

    const safeLimit = Math.min(
      100,
      Math.max(
        1,
        Number.parseInt(limit, 10) || 10
      )
    );

    const offset =
      (safePage - 1) * safeLimit;

    const result =
      await DoctorModel.findAllWithRegistration({
        limit: safeLimit,
        offset,
        search,
      });

    const data = result.rows.map((doctor) => {

      return {

        full_name:
          doctor.full_name,

        gender:
          doctor.gender,

        age:
          doctor.age,

        email:
          doctor.email,

        mobile:
          doctor.mobile,

        medical_registration_number:
          doctor.medical_registration_number,

        medical_council:
          doctor.medical_council,

        qualification:
          doctor.qualification,

        specialization:
          doctor.specialization,

        onboarding_status:
          doctor.onboarding_status,

        selfie:
          doctor.selfie || null,

        experience:
          doctor.experience,

        language:
          safeParse(
            doctor.language,
            []
          ),

        consultation_fee:
          doctor.consultation_fee,

        bio:
          doctor.bio,

        availability:
          safeParse(
            doctor.availability,
            []
          ),

        hospital_detail:
          safeParse(
            doctor.hospital_detail,
            []
          ),

        qr_url:
          doctor.qr_url || null,

        accept_emergency_patients:
          doctor.accept_emergency_patients,

        avgRating:
          Number(
            doctor.avg_rating || 0
          ),

        totalFeedbacks:
          Number(
            doctor.total_feedbacks || 0
          ),

        totalRatings:
          Number(
            doctor.total_ratings || 0
          ),
      };
    });

    const totalPages =
      Math.ceil(
        result.total / safeLimit
      );

    return {
      data,

      pagination: {
        total: result.total,
        page: safePage,
        limit: safeLimit,
        totalPages,
      },
    };

  } catch (error) {

    console.error(
      "GET ALL DOCTORS SERVICE ERROR:",
      error
    );

    throw error;
  }
};
