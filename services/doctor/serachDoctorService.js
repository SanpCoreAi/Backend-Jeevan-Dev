require("dotenv").config();
const { findAllWithUsers } = require("../../models/doctorModel");

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

  let doctors = await findAllWithUsers();

  doctors = doctors.map((d) => ({
    user_id: d.user_id,
    full_name: d.user_full_name,
    email: d.user_email,
    phone_number: d.user_phone_number,
    username: d.username,
    specialization: d.specialization,
    qualification: d.qualification,
    experience: Number(d.experience) || 0,
    consultation_fee: Number(d.consultation_fee) || 0,
    medical_license_no: d.medical_license_no,
    bio: d.bio,
    accept_emergency_patients: d.accept_emergency_patients,

    city: d.city || "",
    state: d.state || "",
    pin_code: d.pin_code || "",
    district: d.district || "",
    landmark: d.landmark || "",

    language: parseJSON(d.language),
    availability: parseJSON(d.availability),
    hospitalDetail: parseJSON(d.hospital_detail),
    images: parseJSON(d.images),

    avg_rating: d.avg_rating,
    total_feedbacks: Number(d.total_feedbacks ?? 0),
    total_ratings: Number(d.total_ratings ?? 0),
  }));

  doctors = doctors.filter((d) => {
    if (!search) return true;

    const s = normalize(search);

    const isEmergencySearch = s.includes("emergency");

    const words = s.split(" ");

    const fullName = normalize(d.full_name);
    const username = normalize(d.username);
    const specialization = normalize(d.specialization);
    const qualification = normalize(d.qualification);
    const medicalLicense = normalize(d.medical_license_no);
    const city = normalize(d.city);
    const state = normalize(d.state);
    const district = normalize(d.district);
    const landmark = normalize(d.landmark);

    const acceptEmergencyPatients =
      normalize(d.accept_emergency_patients);

    // Emergency search
    if (isEmergencySearch) {
      return acceptEmergencyPatients === "yes";
    }

    const hospitalNames = (d.hospitalDetail || [])
      .map(h => normalize(h.hospitalName));

    const streetNames = (d.hospitalDetail || [])
      .map(h => normalize(h.streetName));

    const areaLocalities = (d.hospitalDetail || [])
      .map(h => normalize(h.areaLocality));

    const hospitalCities = (d.hospitalDetail || [])
      .map(h => normalize(h.city));

    const hospitalStates = (d.hospitalDetail || [])
      .map(h => normalize(h.state));

    const hospitalPinCodes = (d.hospitalDetail || [])
      .map(h => normalize(h.pinCode));

    const hospitalDistricts = (d.hospitalDetail || [])
      .map(h => normalize(h.district));

    const hospitalLandmarks = (d.hospitalDetail || [])
      .map(h => normalize(h.landmark));

    const languages = (d.language || [])
      .map((l) => normalize(l));

    return words.every((word) => {
      const isNumber = /^\d+$/.test(word);

      if (!isNumber) {
        return (
          fullName.includes(word) ||
          username.includes(word) ||
          specialization.includes(word) ||
          qualification.includes(word) ||
          medicalLicense.includes(word) ||
          acceptEmergencyPatients.includes(word) ||

          city.includes(word) ||
          state.includes(word) ||
          district.includes(word) ||
          landmark.includes(word) ||

          hospitalNames.some(h => h.includes(word)) ||
          streetNames.some(s => s.includes(word)) ||
          areaLocalities.some(a => a.includes(word)) ||
          hospitalCities.some(c => c.includes(word)) ||
          hospitalStates.some(s => s.includes(word)) ||
          hospitalDistricts.some(d => d.includes(word)) ||
          hospitalLandmarks.some(l => l.includes(word)) ||

          languages.some((l) => l.includes(word))
        );
      }

      return (
        hospitalPinCodes.some(p => p.includes(word)) ||
        String(d.experience) === word ||
        String(d.consultation_fee) === word
      );
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

  return {
    success: true,
    statusCode: 200,
    message: doctors.length
      ? "Doctors fetched successfully."
      : "No doctors found.",

    total: doctors.length,
    page,
    limit,

    data: paginated.map((d) => ({
      userId: d.user_id,

      fullName: d.full_name,
      email: d.email,
      phoneNumber: d.phone_number,

      username: d.username,
      specialization: d.specialization,
      qualification: d.qualification,
      medicalLicenseNo: d.medical_license_no,
      acceptEmergencyPatients:
        d.accept_emergency_patients,

      experience: d.experience,
      consultationFee: d.consultation_fee,
      bio: d.bio,

      language: d.language,
      availability: d.availability,
      hospitalDetail: d.hospitalDetail,

      avgRating: Number(d.avg_rating || 0).toFixed(1),
      totalFeedbacks: Number(d.total_feedbacks || 0),
      totalRatings: Number(d.total_ratings || 0),
      positiveFeedbacks: Number(d.positive_feedbacks || 0),
      negativeFeedbacks: Number(d.negative_feedbacks || 0),

      profileImage:
        d.images?.length && d.images[0].fileKey
          ? `${BASE_FILE_URL}/${encodeURI(d.images[0].fileKey)}`
          : null,
    })),
  };
}

module.exports = { searchDoctorService };