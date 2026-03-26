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
  return userProfileModel.createUserProfile(userId, body);
};

// exports.getProfile = async (userId) => {
//   const profile = await userProfileModel.getUserProfileByUserId(userId);
//   if (!profile) return null;

//   return {
//     ...profile,
//     language: safeParse(profile.language),
//     existing_conditions: safeParse(profile.existing_conditions),
//     allergies: safeParse(profile.allergies),
//     address: safeParse(profile.address, {})
//   };
// };

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
