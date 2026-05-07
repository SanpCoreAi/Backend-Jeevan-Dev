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
      success: false,
      message: "Doctor profile not found"
    };
  }

  let qrCode = d.qr_code;

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

  return {
    success: true,
    data: {
      id: d.user_id,
      username: d.username,
      specialization: d.specialization,
      qualification: d.qualification,
      experience: d.experience,
      consultationFee: d.consultation_fee,
      bio: d.bio,

      language: parseJSON(d.language),
      availability: parseJSON(d.availability),
      hospitalDetail: parseJSON(d.hospital_detail),

      user: {
        fullName: d.user_full_name,
        email: d.user_email,
        phoneNumber: d.user_phone_number
      },

      imageUrl: d.image_key
        ? `${S3_BASE_URL}/${d.image_key}`
        : null,

      avgRating: Number(d.avg_rating),

      qr_code: `${BASE_FILE_URL}/qr/${qrCode}`
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
    data: {
      id: doctor.id,
      userId: doctor.user_id,
      username: doctor.username,
      specialization: doctor.specialization,
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

      avgRating: Number(doctor.avg_rating)
    }
  };
}

async function updateProfile(userId, body) {
  if (!userId) {
    throw new Error("Unauthorized user");
  }

  const params = [
    body.username ?? null,
    body.specialization ?? null,
    body.qualification ?? null,
    body.experience ?? 0,
    JSON.stringify(body.language ?? []),
    body.consultationFee ?? 0,
    body.medicalLicenseNo ?? null,
    body.bio ?? null,
    JSON.stringify(body.availability ?? []),
    JSON.stringify(body.hospitalDetail ?? []),
    userId
  ];

  await DoctorModel.updateDoctor(params);

  return {
    success: true,
    message: "Doctor profile updated successfully"
  };
}

async function getAllDoctors() {
  const doctors = await DoctorModel.findAllWithUser();

  return doctors.map(d => ({
    doctorId: d.doctor_id,
    userId: d.user_id,
    username: d.username,
    specialization: d.specialization,
    qualification: d.qualification,
    experience: d.experience,
    consultationFee: d.consultation_fee,

    user: {
      fullName: d.user_full_name,
      email: d.user_email,
      phoneNumber: d.user_phone_number
    },

    language: parseJSON(d.language),
    availability: parseJSON(d.availability),
    hospitalDetail: parseJSON(d.hospital_detail),

    images: parseJSON(d.images),

    avgRating: Number(d.avg_rating),

    qr_code: d.qr_code
      ? `${BASE_FILE_URL}/qr/${d.qr_code}`
      : null
  }));
}

module.exports = {
  createProfile,
  updateProfile,
  getAllDoctors,
  getProfile,
  getDoctorPublicProfileById
};