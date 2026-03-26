const DoctorModel = require("../../models/doctorModel");
const safeJSON = require("../../utils/safeJson");
const QRCode = require("qrcode");

function parseJSON(data, defaultValue = []) {
  try {
    if (!data) return defaultValue;
    if (typeof data === "string") return JSON.parse(data);
    return data;
  } catch (err) {
    return defaultValue;
  }
}

const BASE_FILE_URL = "doctor-profile-upload-file";

const buildFileUrl = (folder, fileKey) => {
  if (!fileKey) return null;

  if (fileKey.includes("/")) {
    return `${BASE_FILE_URL}/${fileKey}`;
  }

  return `${BASE_FILE_URL}/${folder}/${fileKey}`;
};

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

/* ================= CREATE PROFILE ================= */

async function createProfile(userId, body) {

  if (!userId) {
    return { success: false, message: "Unauthorized user" };
  }

  if (!body.username || !body.specialization) {
    return {
      success: false,
      message: "Username and specialization are required"
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

  const qrCode = await QRCode.toDataURL(qrData);

  await DoctorModel.updateDoctorQr(doctorId, qrCode);

  return {
    success: true,
    userId,
    doctorId,
    qrCode
  };
}

/* ================= GET PROFILE ================= */

async function getProfile(userId) {

  if (!userId) {
    return {
      success: false,
      message: "Unauthorized user"
    };
  }

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

    qrCode = await QRCode.toDataURL(qrData);

    await DoctorModel.updateDoctorQr(d.id, qrCode);
  }

  const images = parseJSON(d.images);
  const files = parseJSON(d.files);

  return {
    success: true,
    data: {
      id: Number(d.user_id),
      fullName: d.user_full_name,
      email: d.user_email,
      phoneNumber: d.user_phone_number,

      username: d.username,
      specialization: d.specialization,
      qualification: d.qualification,
      experience: Number(d.experience),
      consultationFee: Number(d.consultation_fee),
      medicalLicenseNo: d.medical_license_no,
      bio: d.bio,

      language: parseJSON(d.language),
      availability: parseJSON(d.availability),
      hospitalDetail: parseJSON(d.hospital_detail),

      avgRating: Number(d.avg_rating || 0),

      images: images.map(img => ({
        id: img.id,
        fileKey: img.fileKey,
        url: buildFileUrl(img.folder, img.fileKey)
      })),

      files: files.map(file => ({
        id: file.id,
        fileKey: file.fileKey,
        url: buildFileUrl(file.folder, file.fileKey)
      })),

      profileImage:
        images.length > 0
          ? buildFileUrl(images[0].folder, images[0].fileKey)
          : `${BASE_FILE_URL}/default-doctor-profile.png`,

      qr_code: qrCode
    }
  };
}

/* ================= PUBLIC PROFILE ================= */

async function getDoctorPublicProfileById(doctorId) {

  const doctor = await DoctorModel.getDoctorPublicProfileById(doctorId);

  if (!doctor) {
    return {
      success: false,
      message: "Doctor profile not found"
    };
  }

  let qrCode = doctor.qr_code;

  if (!qrCode) {

    const hospitalDetail = parseJSON(doctor.hospital_detail);

    const hospitals = hospitalDetail.map(h => ({
      hospitalName: h.hospitalName,
      address: buildAddress(h)
    }));

    const qrData = JSON.stringify({
      doctorId: doctor.user_id,
      hospitals
    });

    qrCode = await QRCode.toDataURL(qrData);

    await DoctorModel.updateDoctorQr(doctor.id, qrCode);
  }

  const images = parseJSON(doctor.images);

  return {
    success: true,
    data: {
      userId: Number(doctor.user_id),
      fullName: doctor.user_full_name,
      username: doctor.username,
      specialization: doctor.specialization,
      experience: Number(doctor.experience),
      consultationFee: Number(doctor.consultation_fee),
      hospitalDetail: parseJSON(doctor.hospital_detail),
      qr_code: qrCode,
      profileImage:
        images.length > 0
          ? buildFileUrl(images[0].folder, images[0].fileKey)
          : `${BASE_FILE_URL}/default-doctor-profile.png`
    }
  };
}

/* ================= UPDATE PROFILE ================= */

async function updateProfile(userId, body) {

  const doctor = await DoctorModel.getByUserId(userId);

  if (!doctor) {
    return {
      success: false,
      message: "Doctor profile not found"
    };
  }

  const params = [
    body.username || doctor.username,
    body.specialization || doctor.specialization,
    body.qualification || doctor.qualification,
    body.experience ?? doctor.experience,
    JSON.stringify(body.language || safeJSON(doctor.language, [])),
    body.consultationFee ?? doctor.consultation_fee,
    body.medicalLicenseNo || doctor.medical_license_no,
    body.bio || doctor.bio,
    JSON.stringify(body.availability || safeJSON(doctor.availability, [])),
    JSON.stringify(body.hospitalDetail || safeJSON(doctor.hospital_detail, [])),
    userId
  ];

  await DoctorModel.updateDoctor(params);

  return {
    success: true,
    message: "Doctor profile updated successfully"
  };
}

/* ================= GET ALL DOCTORS ================= */

async function getAllDoctors() {

  const doctors = await DoctorModel.getAllDoctors();

  return {
    success: true,
    data: doctors.map(d => ({
      id: d.id,
      username: d.username,
      specialization: d.specialization,
      qualification: d.qualification,
      experience: d.experience,
      language: safeJSON(d.language, []),
      consultationFee: d.consultation_fee,
      hospitalDetail: safeJSON(d.hospital_detail, [])
    }))
  };
}

module.exports = {
  createProfile,
  getProfile,
  updateProfile,
  getDoctorPublicProfileById,
  getAllDoctors
};