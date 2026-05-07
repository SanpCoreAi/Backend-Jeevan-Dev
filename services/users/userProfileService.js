const userProfileModel = require("../../models/userProfileModel");
const { validateUserProfile } = require("../../validation/user/userProfile");

const safeParse = (value, defaultValue = []) => {
  if (!value) return defaultValue;

  try {
    return typeof value === "string" ? JSON.parse(value) : value;
  } catch {
    return defaultValue;
  }
};

exports.createProfile = async (userId, body) => {
  try {
    const errors = validateUserProfile(body);

    if (errors.length > 0) {
      return {
        success: false,
        statusCode: 400,
        message: errors
      };
    }

    if (body.language && !Array.isArray(body.language)) {
      body.language = [body.language];
    }

    if (body.existing_conditions && !Array.isArray(body.existing_conditions)) {
      body.existing_conditions = [body.existing_conditions];
    }

    if (body.allergies && !Array.isArray(body.allergies)) {
      body.allergies = [body.allergies];
    }

    const result = await userProfileModel.createUserProfile(userId, body);

    if (!result) {
      return {
        success: false,
        statusCode: 400,
        message: "Profile creation failed"
      };
    }

    return {
      success: true,
      statusCode: 201,
      message: "Profile created successfully",
      data: result
    };

  } catch (error) {
    return {
      success: false,
      statusCode: 500,
      message: error.message || "Something went wrong"
    };
  }
};

exports.updateUserProfile = async (userId, body) => {
  try {

    const existing = await userProfileModel.getUserProfileByUserId(userId);

    if (!existing || !existing.username) {
      return {
        success: false,
        statusCode: 404,
        message: "Profile not found"
      };
    }

    if (body.language && !Array.isArray(body.language)) {
      body.language = [body.language];
    }

    if (body.existing_conditions && !Array.isArray(body.existing_conditions)) {
      body.existing_conditions = [body.existing_conditions];
    }

    if (body.allergies && !Array.isArray(body.allergies)) {
      body.allergies = [body.allergies];
    }

    if (body.address && typeof body.address !== "object") {
      return {
        success: false,
        statusCode: 400,
        message: "Address must be an object"
      };
    }

    if (body.emergency_contact && typeof body.emergency_contact !== "object") {
      return {
        success: false,
        statusCode: 400,
        message: "Emergency contact must be an object"
      };
    }

    const updated = await userProfileModel.updateUserProfile(userId, body);

    if (!updated) {
      return {
        success: false,
        statusCode: 400,
        message: "Update failed"
      };
    }

    const updatedProfile =
      await userProfileModel.getUserProfileByUserId(userId);

    return {
      success: true,
      message: "Profile updated successfully",
      data: {
        ...updatedProfile,
        language: safeParse(updatedProfile.language),
        existing_conditions: safeParse(updatedProfile.existing_conditions),
        allergies: safeParse(updatedProfile.allergies),
        address: safeParse(updatedProfile.address, {}),
        emergency_contact: safeParse(
          updatedProfile.emergency_contact,
          {}
        )
      }
    };

  } catch (err) {
    return {
      success: false,
      statusCode: 500,
      message: err.message || "Update failed"
    };
  }
};

exports.getPatientCardProfile = async (userId) => {
  try {

    const profile = await userProfileModel.getPatientCardProfile(userId);

    if (!profile) {
      return {
        success: false,
        statusCode: 404,
        message: "Patient profile not found"
      };
    }

    return {
      success: true,
      message: "Patient details fetched successfully",
      data: profile
    };

  } catch (error) {
    return {
      success: false,
      statusCode: 500,
      message: error.message
    };
  }
};

exports.getUserProfile = async (userId) => {

  const profile = await userProfileModel.getUserProfileByUserId(userId);

  if (!profile) return null;

  return {
    ...profile,
    language: safeParse(profile.language),
    existing_conditions: safeParse(profile.existing_conditions),
    allergies: safeParse(profile.allergies),
    address: safeParse(profile.address, {}),
    emergency_contact: safeParse(profile.emergency_contact, {})
  };
};