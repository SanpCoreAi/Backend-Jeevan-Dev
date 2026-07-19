const DoctorModel = require("../../models/doctorModel");
const safeJSON = require("../../utils/safeJson");
const QRCode = require("qrcode");
const path = require("path");
const fs = require("fs");

const BASE_FILE_URL = "http://localhost:4000/uploads";
const S3_BASE_URL = process.env.AWS_S3_BUCKET_URL;

function parseJSON(data, defaultValue = []) {
  try {
    if (!data) return defaultValue;
    if (typeof data === "string") return JSON.parse(data);
    return data;
  } catch {
    return defaultValue;
  }
}

const qrFolder = path.join(__dirname, "../../uploads/qr");

if (!fs.existsSync(qrFolder)) {
  fs.mkdirSync(qrFolder, { recursive: true });
}

function buildAddress(hospital) {
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
    hospital.pinCode
  ]
    .filter(Boolean)
    .join(", ");
}

async function createProfile(userId, body) {
  if (!userId) {
    return {
      success: false,
      message: "Unauthorized user"
    };
  }

const params = [
  userId ?? null,
  body.username ?? null,
  body.specialization ?? null,
  body.qualification ?? null,
  body.experience ?? 0,
  JSON.stringify(body.language ?? []),
  body.consultationFee ?? 0,
  body.medicalLicenseNo ?? null,
  body.bio ?? null,
  body.age ?? null,          // NEW
  body.gender ?? null,       // NEW
  JSON.stringify(body.availability ?? []),
  JSON.stringify(body.hospitalDetail ?? [])
];

  const doctorId = await DoctorModel.createDoctor(params);

  const hospitalDetail = parseJSON(body.hospitalDetail);

  const hospitals = hospitalDetail.map(h => ({
    hospitalName: h.hospitalName,
    address: buildAddress(h)
  }));

  const qrData = JSON.stringify({
    doctorId: userId,
    hospitals
  });

  const fileName = `qr_${doctorId}.png`;
  const filePath = path.join(qrFolder, fileName);

  await QRCode.toFile(filePath, qrData);

  await DoctorModel.updateDoctorQr(doctorId, fileName);

  return {
    success: true,
    userId,
    doctorId,
    qrCode: `${BASE_FILE_URL}/qr/${fileName}`
  };
}

async function getProfile(userId) {
  const d = await DoctorModel.getBydoctorId(userId);

  if (!d) {
    return {
      statusCode: 404,
      success: false,
      message: "User not found."
    };
  }

  let qrCode = null;

  if (d.id) {

    qrCode = d.qr_code;

    if (!qrCode) {

      const hospitalDetail = parseJSON(d.hospital_detail);

      const hospitals = hospitalDetail.map(h => ({
        hospitalName: h.hospitalName,
        address: buildAddress(h)
      }));

      const qrData = JSON.stringify({
        doctorId: d.user_id,
        hospitals
      });

      const fileName = `qr_${d.id}.png`;
      const filePath = path.join(qrFolder, fileName);

      await QRCode.toFile(filePath, qrData);

      await DoctorModel.updateDoctorQr(d.id, fileName);

      qrCode = fileName;
    }
  }

  return {
    statusCode: 200,
    success: true,
    message: "Doctor profile fetched successfully.",
    data: {

      id: d.user_id,

      username: d.username,
      specialization: d.specialization,
      medicalLicenseNo: d.medical_license_no,
      qualification: d.qualification,
      experience: d.experience,
      consultationFee: d.consultation_fee,
      bio: d.bio,
      age: d.age,
      gender: d.gender,

      language: parseJSON(d.language),
      availability: parseJSON(d.availability),
      hospitalDetail: parseJSON(d.hospital_detail),

      user: {
        fullName: d.user_full_name,
        email: d.user_email,
        phoneNumber: d.user_phone_number
      },

      image: d.image_file_key
        ? {
            url: `${S3_BASE_URL}/${encodeURI(d.image_file_key)}`
          }
        : null,

      licenseFiles:
        parseJSON(d.files)?.length
          ? parseJSON(d.files).map(file => ({
              url: `${S3_BASE_URL}/${encodeURI(file.fileKey)}`
            }))
          : [],

      avgRating: Number(d.avg_rating || 0),

      qr_code: qrCode
        ? `${BASE_FILE_URL}/qr/${qrCode}`
        : null
    }
  };
}

async function getDoctorPublicProfileById(userId) {
  const doctor = await DoctorModel.getDoctorPublicProfileById(userId);

  if (!doctor) {
    return {
      success: false,
      message: "Doctor not found",
      statusCode: 404
    };
  }

  return {
    success: true,
    statusCode: 200,
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
      language: parseJSON(doctor.language),
      availability: parseJSON(doctor.availability),
      hospitalDetail: parseJSON(doctor.hospital_detail),
      user: {
        fullName: doctor.user_full_name,
        email: doctor.user_email,
        phoneNumber: doctor.user_phone_number
      },

      image: doctor.image_file_key
        ? {
            url: doctor.image_file_key
          }
        : null,
      avgRating: doctor.avg_rating == null? "0.0": Number(doctor.avg_rating).toFixed(1),
      totalFeedbacks: Number(doctor.total_feedbacks ?? 0),
      totalRatings: Number(doctor.total_ratings ?? 0)
    }
  };
}

async function updateProfile(userId, body) {
  try {

    if (!userId) {
      return {
        success: false,
        statusCode: 401,
        message: "Unauthorized user."
      };
    }

    if (!body || Object.keys(body).length === 0) {
      return {
        success: false,
        statusCode: 400,
        message: "At least one field is required."
      };
    }

    const doctor = await DoctorModel.getDoctorByUserId(userId);

    // CREATE
    if (!doctor) {

      await DoctorModel.createDoctor(userId, body);

      return {
        success: true,
        statusCode: 201,
        message: "Doctor profile created successfully."
      };
    }

    const result = await DoctorModel.updateDoctor(userId, body);

    if (result.affectedRows === 0) {
      return {
        success: false,
        statusCode: 400,
        message: "Doctor profile update failed."
      };
    }

    return {
      success: true,
      statusCode: 200,
      message: "Doctor profile updated successfully."
    };

  } catch (err) {

    console.error(err);

    return {
      success: false,
      statusCode: 500,
      message: "Internal Server Error"
    };
  }
}

async function getAllDoctors() {

  const doctors = await DoctorModel.findAllWithUser();

  return doctors.map((d) => {

    let qrUrl = null;

    if (d.qr_code) {
      qrUrl = d.qr_code.startsWith("http") || d.qr_code.startsWith("data:")
        ? d.qr_code
        : `${BASE_FILE_URL}/qr/${d.qr_code}`;
    }

    const images = parseJSON(d.images, []).map((img) => ({
      ...img,
      url: `${S3_BASE_URL}/${encodeURI(img.fileKey)}`
    }));

    return {

      doctorId: d.doctor_id,

      userId: d.user_id,

      username: d.username,

      specialization: d.specialization,

      qualification: d.qualification,

      medicalLicenseNo: d.medical_license_no,

      experience: d.experience,

      consultationFee: d.consultation_fee,

      bio: d.bio,

      age: d.age,

      gender: d.gender,

      language: parseJSON(d.language),

      availability: parseJSON(d.availability),

      hospitalDetail: parseJSON(d.hospital_detail),

      user: {

        fullName: d.user_full_name,

        email: d.user_email,

        phoneNumber: d.user_phone_number
      },

      images,

      avgRating: Number(d.avg_rating || 0),

      totalFeedbacks: Number(d.total_feedbacks || 0),

      totalRatings: Number(d.total_ratings || 0),

      qr_code: qrUrl
    };

  });

}

module.exports = {
  createProfile,
  updateProfile,
  getAllDoctors,
  getProfile,
  getDoctorPublicProfileById
};