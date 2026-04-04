const userProfileModel = require("../../models/userProfileModel");

const safeParse = (value, defaultValue = []) => {
  if (!value) return defaultValue;

  value = value.toString().trim();

  try {
    if (value.startsWith("[")) {
      return JSON.parse(value);
    }
    return value.split(",").map(v => v.trim());
  } catch {
    return defaultValue;
  }
};

exports.createProfile = async (userId, body) => {
  return  userProfileModel.createUserProfile(userId, body);
};

exports.getPatientDetails = async (patientId) => {
  const result = await userProfileModel.getPatientDetails(patientId);

  if (!result || result.length === 0) {
    return null;
  }

  const p = result[0];

return {
  patient_id: p.patient_id,
  name: p.name,
  age: p.age || "N/A",
  sex: p.gender || "N/A",
  weight: p.weight || "N/A",
  height: p.height || "N/A",  
  allergies: p.allergies || "N/A",
  existing_conditions: p.existing_conditions || "N/A", 
  phone: p.phone || "N/A",
  email: p.email || "N/A",
  blood_group: p.blood_group || "N/A",
  reg_date: p.created_at || "N/A",
  last_appointment: p.last_appointment || "N/A",
  mode: p.appointment_type || "N/A",
  visit_type: p.booking_type || "N/A",
  diagnosis: "N/A",
  payment_status: "Pending"
};
};


exports.getProfile = async (userId) => {
  const profile = await userProfileModel.getUserProfileByUserId(userId);
  if (!profile) return null;

  return {
    ...profile,
    language: safeParse(profile.language),
    existing_conditions: safeParse(profile.existing_conditions),
    allergies: safeParse(profile.allergies),
    address: safeParse(profile.address, {}),
    doctor_image: profile.doctor_image || null
  };
};
