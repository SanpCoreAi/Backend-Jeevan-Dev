require("dotenv").config();
const { findAllWithUser } = require("../../models/doctorModel");

const BASE_FILE_URL =
  process.env.AWS_S3_BUCKET_URL || process.env.APP_BASE_URL;

const parseJSON = (value, fallback = []) => {
  if (!value) return fallback;
  if (Array.isArray(value)) return value;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
};

const normalize = (str) => {
  return String(str || "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ");
};

async function searchDoctorService(filters) {
  let {
    search,
    page = 1,
    limit = 10,
    sortBy = "experience",
    order = "desc",
  } = filters;

  page = Math.max(1, Number(page));
  limit = Math.min(50, Math.max(1, Number(limit)));
  const offset = (page - 1) * limit;

  let doctors = await findAllWithUser();

  doctors = doctors.map((d) => ({
    id: d.doctor_id,
    full_name: d.user_full_name,
    email: d.user_email,
    phone_number: d.user_phone_number,
    username: d.username,
    specialization: d.specialization,
    qualification: d.qualification,
    experience: Number(d.experience),
    consultation_fee: Number(d.consultation_fee),
    medical_license_no: d.medical_license_no,
    bio: d.bio,
    language: parseJSON(d.language),
    availability: parseJSON(d.availability),
    hospitalDetail: parseJSON(d.hospital_detail),
    images: parseJSON(d.images),
    files: parseJSON(d.files),
    avg_rating: Number(d.avg_rating || 0),
  }));

doctors = doctors.filter((d) => {
  if (!search) return true;

  const s = normalize(search);
  const words = s.split(" ");

  const fullName = normalize(d.full_name);
  const username = normalize(d.username);
  const specialization = normalize(d.specialization);
  const qualification = normalize(d.qualification);
  const medicalLicense = normalize(d.medical_license_no);

  const experience = String(d.experience || "");
  const fee = String(d.consultation_fee || "");

  const languages = (d.language || []).map((l) => normalize(l));

  const hospitals = Array.isArray(d.hospitalDetail)
    ? d.hospitalDetail
    : [];

  // 🔥 MAIN LOGIC
  return words.every((word) => {

    const isNumber = /^\d+$/.test(word);

    // =========================
    // ✅ Doctor level match
    // =========================
    let doctorMatch = false;

    if (!isNumber) {
      doctorMatch =
        fullName.includes(word) ||
        username.includes(word) ||
        specialization.includes(word) ||
        qualification.includes(word) ||
        medicalLicense.includes(word) ||
        languages.some((l) => l.includes(word));
    } else {
      doctorMatch =
        experience === word ||
        fee === word;
    }

    // =========================
    // ✅ Hospital level match
    // =========================
    const hospitalMatch = hospitals.some((h) => {
      const hospitalName = normalize(h?.hospitalName);
      const city = normalize(h?.city);
      const state = normalize(h?.state);
      const district = normalize(h?.district);
      const pin = normalize(h?.pinCode);
      const landmark = normalize(h?.landmark);
      const area = normalize(h?.areaLocality);
      const street = normalize(h?.streetName);
      const society = normalize(h?.buildingSociety);
      const flat = normalize(h?.flatPlotNo);

      if (isNumber) {
        return pin === word; // 🔥 exact pincode match
      }

      return (
        hospitalName.includes(word) ||
        city.includes(word) ||
        state === word ||          // 🔥 STATE FIX (EXACT MATCH)
        district.includes(word) ||
        landmark.includes(word) ||
        area.includes(word) ||
        street.includes(word) ||
        society.includes(word) ||
        flat.includes(word)
      );
    });

    return doctorMatch || hospitalMatch;
  });
});

  const seen = new Set();
  doctors = doctors.filter((d) => {
    if (seen.has(d.email)) return false;
    seen.add(d.email);
    return true;
  });

  doctors.sort((a, b) => {
    if (sortBy === "experience") {
      return order === "asc"
        ? a.experience - b.experience
        : b.experience - a.experience;
    }

    if (sortBy === "consultationFee") {
      return order === "asc"
        ? a.consultation_fee - b.consultation_fee
        : b.consultation_fee - a.consultation_fee;
    }

    return order === "asc"
      ? normalize(a.full_name).localeCompare(normalize(b.full_name))
      : normalize(b.full_name).localeCompare(normalize(a.full_name));
  });

  const paginated = doctors.slice(offset, offset + limit);

  // 🔹 FINAL RESPONSE FORMAT
  return {
    success: true,
    total: doctors.length,
    page,
    limit,
    data: paginated.map((d) => ({
      id: d.id,
      fullName: d.full_name,
      email: d.email,
      phoneNumber: d.phone_number,
      username: d.username,
      specialization: d.specialization,
      qualification: d.qualification,
      experience: d.experience,
      consultationFee: d.consultation_fee,
      medicalLicenseNo: d.medical_license_no,
      bio: d.bio,
      language: d.language,
      availability: d.availability,
      hospitalDetail: d.hospitalDetail,
      avgRating: d.avg_rating,

      images: (d.images || []).map((img) => ({
        id: img.id,
        fileKey: img.fileKey,
        url: img.fileKey ? `${BASE_FILE_URL}/${img.fileKey}` : null,
      })),

      files: (d.files || []).map((file) => ({
        id: file.id,
        fileKey: file.fileKey,
        url: file.fileKey ? `${BASE_FILE_URL}/${file.fileKey}` : null,
      })),

      profileImage: d.images?.[0]?.fileKey
        ? `${BASE_FILE_URL}/${d.images[0].fileKey}`
        : null,
    })),
  };
}

module.exports = { searchDoctorService };