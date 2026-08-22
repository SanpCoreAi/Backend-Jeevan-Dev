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
      };
    }

    const doctor = await DoctorModel.getBydoctorId(userId);

    if (!doctor) {
      return {
        success: false,
        statusCode: 404,
        message: "Doctor profile not found.",
      };
    }

    let qrCode = doctor.qr_code || null;

    if (doctor.id && !qrCode) {
      try {
        const hospitalDetail = safeParse(doctor.hospital_detail, []);

        const hospitals = hospitalDetail.map((hospital) => ({
          hospitalName: hospital.hospitalName,
          address: buildAddress(hospital),
        }));

        const qrData = JSON.stringify({
          doctorId: doctor.user_id,
          hospitals,
        });

        const fileName = `qr_${doctor.id}.png`;
        const filePath = path.join(qrFolder, fileName);

        await QRCode.toFile(filePath, qrData);

        await DoctorModel.updateDoctorQr(
          doctor.id,
          fileName
        );

        qrCode = fileName;

      } catch (qrError) {
        console.error("QR GENERATION ERROR:", qrError);
      }
    }

    return {
      success: true,
      statusCode: 200,
      message: "Doctor profile fetched successfully.",
      data: {
        id: doctor.user_id,

        username: doctor.username,
        specialization: doctor.specialization,
        medicalLicenseNo: doctor.medical_license_no,
        qualification: doctor.qualification,
        experience: doctor.experience,
        consultationFee: doctor.consultation_fee,
        bio: doctor.bio,
        age: doctor.age,
        gender: doctor.gender,
        accept_emergency_patients: doctor.accept_emergency_patients,

        language: safeParse(doctor.language, []),
        availability: safeParse(doctor.availability, []),
        hospitalDetail: safeParse(
          doctor.hospital_detail,
          []
        ),

        user: {
          fullName: doctor.user_full_name,
          email: doctor.user_email,
          phoneNumber: doctor.user_phone_number,
        },

        image: doctor.image_file_key
          ? {
            url: S3_BASE_URL
              ? `${encodeURI(
                doctor.image_file_key
              )}`
              : null,
          }
          : null,

        licenseFiles: safeParse(doctor.files, []).map((file) => ({
          url: file.fileKey.startsWith("http")
            ? file.fileKey
            : `${encodeURI(file.fileKey)}`
        })),

        avgRating: Number(doctor.avg_rating || 0),

        qr_code: buildQrUrl(qrCode),
      },
    };
  } catch (error) {
    console.error("GET DOCTOR PROFILE SERVICE ERROR:", error);

    return {
      success: false,
      statusCode: 500,
      message: "Internal Server Error",
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
        id: doctor.id,
        userId: doctor.user_id,

        username: doctor.username,
        specialization: doctor.specialization,
        age: doctor.age,
        gender: doctor.gender,
        qualification: doctor.qualification,
        experience: doctor.experience,
        consultationFee: doctor.consultation_fee,
        bio: doctor.bio,
        accept_emergency_patients: doctor.accept_emergency_patients,

        language: safeParse(doctor.language, []),
        availability: safeParse(doctor.availability, []),
        hospitalDetail: safeParse(
          doctor.hospital_detail,
          []
        ),

        user: {
          fullName: doctor.user_full_name,
          email: doctor.user_email,
          phoneNumber: doctor.user_phone_number,
        },

        image: doctor.image_file_key
          ? {
            url: S3_BASE_URL
              ? `${encodeURI(
                doctor.image_file_key
              )}`
              : null,
          }
          : null,

        avgRating:
          doctor.avg_rating == null
            ? "0.0"
            : Number(doctor.avg_rating).toFixed(1),

        totalFeedbacks: Number(
          doctor.total_feedbacks ?? 0
        ),

        totalRatings: Number(
          doctor.total_ratings ?? 0
        ),
      },
    };

  } catch (error) {

    console.error(
      "GET PUBLIC DOCTOR PROFILE SERVICE ERROR:",
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
      await DoctorModel.findAllWithUser({
        limit: safeLimit,
        offset,
        search,
      });

    const data = result.rows.map((doctor) => {
      let qrUrl = null;

      if (doctor.qr_code) {
        qrUrl = buildQrUrl(doctor.qr_code);
      }

      const images = safeParse(
        doctor.images,
        []
      ).map((image) => ({
        ...image,
        url: S3_BASE_URL
          ? `${S3_BASE_URL}/${encodeURI(
              image.fileKey
            )}`
          : null,
      }));

      return {
        doctorId: doctor.doctor_id,

        userId: doctor.user_id,

        username: doctor.username,

        specialization:
          doctor.specialization,

        qualification:
          doctor.qualification,

        medicalLicenseNo:
          doctor.medical_license_no,

        experience:
          doctor.experience,

        consultationFee:
          doctor.consultation_fee,

        bio: doctor.bio,

        age: doctor.age,

        gender: doctor.gender,

        language: safeParse(
          doctor.language,
          []
        ),

        availability: safeParse(
          doctor.availability,
          []
        ),

        hospitalDetail: safeParse(
          doctor.hospital_detail,
          []
        ),

        user: {
          fullName:
            doctor.user_full_name,

          email:
            doctor.user_email,

          phoneNumber:
            doctor.user_phone_number,
        },

        images,

        avgRating: Number(
          doctor.avg_rating || 0
        ),

        totalFeedbacks: Number(
          doctor.total_feedbacks || 0
        ),

        totalRatings: Number(
          doctor.total_ratings || 0
        ),

        qr_code: qrUrl,
      };
    });

    const totalPages = Math.ceil(
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
