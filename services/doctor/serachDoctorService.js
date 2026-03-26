const { findAllWithUser } = require("../../models/doctorModel");

const parseJSON = (value, fallback = []) => {
  if (!value) return fallback;
  if (Array.isArray(value)) return value;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
};

async function searchDoctorService(filters) {
  let { name, email,  specialization, qualification, experience, medicalLicenseNo, language, hospitalName,
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
  console.log("Total doctors in DB:", doctors.length);

  doctors = doctors.map((d) => ({
    ...d,
    full_name: d.user_full_name,
    email: d.user_email,
    phone_number: d.user_phone_number,
    language: parseJSON(d.language),
    availability: parseJSON(d.availability),
    hospitalDetail: parseJSON(d.hospital_detail),
  }));

  doctors = doctors.filter((d) => {

    if (email && d.email !== email) return false;

    if (name && !d.full_name?.toLowerCase().includes(name.toLowerCase()))
      return false;

    if (
      specialization &&
      !d.specialization?.toLowerCase().includes(specialization.toLowerCase())
    )
      return false;
    if (
      qualification &&
      !d.qualification?.toLowerCase().includes(qualification.toLowerCase())
    )
      return false;
    if (experience && Number(d.experience) < Number(experience)) return false;
    if (medicalLicenseNo && d.medical_license_no !== medicalLicenseNo)
      return false;

    if (language) {
      const searchLang = Array.isArray(language) ? language : [language];
      const doctorLang = d.language.map((l) => l.toLowerCase());
      if (!searchLang.some((l) => doctorLang.includes(l.toLowerCase())))
        return false;
    }

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
      const h = d.hospitalDetail;
      if (!h || !h.address) return false;

      if (
        hospitalName &&
        !h.hospitalName?.toLowerCase().includes(hospitalName.toLowerCase())
      )
        return false;

      const a = h.address;

      if (flatPlotNo && a.flatNo !== flatPlotNo) return false;
      if (
        buildingSociety &&
        !a.building?.toLowerCase().includes(buildingSociety.toLowerCase())
      )
        return false;
      if (
        streetName &&
        !a.street?.toLowerCase().includes(streetName.toLowerCase())
      )
        return false;
      if (
        areaLocality &&
        !a.area?.toLowerCase().includes(areaLocality.toLowerCase())
      )
        return false;
      if (
        landmark &&
        !a.landmark?.toLowerCase().includes(landmark.toLowerCase())
      )
        return false;
      if (
        district &&
        !a.district?.toLowerCase().includes(district.toLowerCase())
      )
        return false;
      if (city && !a.city?.toLowerCase().includes(city.toLowerCase()))
        return false;
      if (state && !a.state?.toLowerCase().includes(state.toLowerCase()))
        return false;
      if (pinCode && a.pinCode !== pinCode) return false;
    }

    return true;
  });

  const uniqueDoctors = [];
  const seenEmails = new Set();
  doctors.forEach((d) => {
    if (!seenEmails.has(d.email)) {
      uniqueDoctors.push(d);
      seenEmails.add(d.email);
    }
  });
  doctors = uniqueDoctors;

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
      ? (a.full_name || "").localeCompare(b.full_name || "")
      : (b.full_name || "").localeCompare(a.full_name || "");
  });

  const finalDoctors = doctors.slice(offset, offset + limit);

return {
  success: true,
  data: finalDoctors.map((d) => ({
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

    // ✅ Doctor Images
    images: (d.images || []).map(img => ({
      id: img.id,
      fileKey: img.fileKey,
      url: `${BASE_FILE_URL}/${img.fileKey}`
    })),

    // ✅ Doctor Files
    files: (d.files || []).map(file => ({
      id: file.id,
      fileKey: file.fileKey,
      url: `${BASE_FILE_URL}/${file.fileKey}`
    })),

    // ✅ Optional single profile image
    profileImage: d.images?.[0]
      ? `${BASE_FILE_URL}/${d.images[0].fileKey}`
      : null
  }))
};



}

module.exports = { searchDoctorService };