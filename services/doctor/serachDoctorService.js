const { findAllWithUser } = require("../../models/doctorModel");



// ✅ Safe JSON parser
const parseJSON = (value, fallback = []) => {
  if (!value) return fallback;
  if (Array.isArray(value)) return value;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
};

// ✅ Normalize function
const normalize = (str) => {
  return String(str || "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ");
};

// 🔥 FUZZY MATCH FUNCTION (NEW)
const fuzzyMatch = (text, searchWords) => {
  return searchWords.some((word) =>
    text.includes(word) ||
    word.includes(text) ||
    text.replace(/\s/g, "").includes(word.replace(/\s/g, ""))
  );
};

async function searchDoctorService(filters) {
  let {
    name,
    email,
    specialization,
    qualification,
    experience,
    medicalLicenseNo,
    language,
    hospitalName,
    flatPlotNo,
    buildingSociety,
    streetName,
    areaLocality,
    landmark,
    district,
    city,
    state,
    pinCode,
    page = 1,
    limit = 10,
    sortBy = "experience",
    order = "desc",
  } = filters;

  page = Math.max(1, Number(page));
  limit = Math.min(50, Math.max(1, Number(limit)));
  const offset = (page - 1) * limit;

  let doctors = await findAllWithUser();

  // ✅ Normalize Data
  doctors = doctors.map((d) => ({
    ...d,
    id: d.doctor_id,
    full_name: d.user_full_name,
    email: d.user_email,
    phone_number: d.user_phone_number,
    language: parseJSON(d.language),
    availability: parseJSON(d.availability),
    hospitalDetail: parseJSON(d.hospital_detail),
    images: parseJSON(d.images),
    files: parseJSON(d.files),
  }));

  // ✅ FILTERING
  doctors = doctors.filter((d) => {
    if (email && normalize(d.email) !== normalize(email)) return false;

    // 🔥 FINAL NAME FILTER (FIXED)
  // ✅ NAME FILTER (STRICT EXACT MATCH)
// ✅ NAME FILTER (STRICT MATCH - FINAL FIX)
if (name) {
  const search = normalize(name);

  const fullNameWords = normalize(d.full_name).split(" ");
  const usernameWords = normalize(d.username).split(" ");

  const match =
    fullNameWords.includes(search) ||
    usernameWords.includes(search);

  if (!match) return false;
}

    if (
      specialization &&
      !normalize(d.specialization).includes(normalize(specialization))
    ) return false;

    if (
      qualification &&
      !normalize(d.qualification).includes(normalize(qualification))
    ) return false;

    if (experience && Number(d.experience) < Number(experience))
      return false;

    if (
      medicalLicenseNo &&
      normalize(d.medical_license_no) !== normalize(medicalLicenseNo)
    ) return false;

    if (language) {
      const searchLang = Array.isArray(language) ? language : [language];
      const doctorLang = (d.language || []).map(normalize);

      const match = searchLang.some((l) =>
        doctorLang.includes(normalize(l))
      );

      if (!match) return false;
    }

    // HOSPITAL FILTER
    if (
      hospitalName ||
      flatPlotNo ||
      buildingSociety ||
      streetName ||
      areaLocality ||
      landmark ||
      district ||
      city ||
      state ||
      pinCode
    ) {
      const hospitals = Array.isArray(d.hospitalDetail)
        ? d.hospitalDetail
        : [];

      const matchHospital = hospitals.some((h) => {
        if (!h) return false;

        if (
          hospitalName &&
          !normalize(h.hospitalName).includes(normalize(hospitalName))
        ) return false;

        if (
          flatPlotNo &&
          normalize(h.flatPlotNo) !== normalize(flatPlotNo)
        ) return false;

        if (
          buildingSociety &&
          !normalize(h.buildingSociety).includes(normalize(buildingSociety))
        ) return false;

        if (
          streetName &&
          !normalize(h.streetName).includes(normalize(streetName))
        ) return false;

        if (
          areaLocality &&
          !normalize(h.areaLocality).includes(normalize(areaLocality))
        ) return false;

        if (
          landmark &&
          !normalize(h.landmark).includes(normalize(landmark))
        ) return false;

        if (
          district &&
          !normalize(h.district).includes(normalize(district))
        ) return false;

        if (
          city &&
          !normalize(h.city).includes(normalize(city))
        ) return false;

        if (
          state &&
          !normalize(h.state).includes(normalize(state))
        ) return false;

        if (
          pinCode &&
          normalize(h.pinCode) !== normalize(pinCode)
        ) return false;

        return true;
      });

      if (!matchHospital) return false;
    }

    return true;
  });

  // REMOVE DUPLICATES
  const seenEmails = new Set();
  doctors = doctors.filter((d) => {
    if (seenEmails.has(d.email)) return false;
    seenEmails.add(d.email);
    return true;
  });

  // SORTING
  doctors.sort((a, b) => {
    if (sortBy === "experience") {
      return order === "asc"
        ? Number(a.experience) - Number(b.experience)
        : Number(b.experience) - Number(a.experience);
    }

    if (sortBy === "consultationFee") {
      return order === "asc"
        ? Number(a.consultation_fee) - Number(b.consultation_fee)
        : Number(b.consultation_fee) - Number(a.consultation_fee);
    }

    return order === "asc"
      ? normalize(a.full_name).localeCompare(normalize(b.full_name))
      : normalize(b.full_name).localeCompare(normalize(a.full_name));
  });

  const paginatedDoctors = doctors.slice(offset, offset + limit);

  return {
    success: true,
    total: doctors.length,
    page,
    limit,
    data: paginatedDoctors.map((d) => ({
      id: Number(d.id),
      fullName: d.full_name,
      email: d.email,
      phoneNumber: d.phone_number,
      username: d.username,
      specialization: d.specialization,
      qualification: d.qualification,
      experience: Number(d.experience),
      consultationFee: Number(d.consultation_fee),
      medicalLicenseNo: d.medical_license_no,
      bio: d.bio,
      language: d.language,
      availability: d.availability,
      hospitalDetail: d.hospitalDetail,
      avgRating: Number(d.avg_rating),

      images: (d.images || []).map((img) => ({
        id: img.id,
        fileKey: img.fileKey,
        url: `${BASE_FILE_URL}/${img.fileKey}`,
      })),

      files: (d.files || []).map((file) => ({
        id: file.id,
        fileKey: file.fileKey,
        url: `${BASE_FILE_URL}/${file.fileKey}`,
      })),

      profileImage: d.images?.[0]?.fileKey
        ? `${BASE_FILE_URL}/${d.images[0].fileKey}`
        : null,
    })),
  };
}

module.exports = { searchDoctorService };