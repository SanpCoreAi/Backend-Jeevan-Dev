const userProfileModel = require("../../models/userProfileModel");
const { validateUserProfile } = require("../../validation/user/userProfile");


const AWS_S3_BUCKET_URL = process.env.AWS_S3_BUCKET_URL;
const APP_BASE_URL = process.env.APP_BASE_URL;

const safeParse = (value, defaultValue = []) => {
  if (!value) return defaultValue;

  try {
    return typeof value === "string"
      ? JSON.parse(value)
      : value;
  } catch {
    return defaultValue;
  }
};



// ================= CREATE PROFILE =================

exports.createProfile = async (userId, body) => {
  try {

    // ✅ validate request body
    const errors = validateUserProfile(body);

    if (errors.length > 0) {
      return {
        success: false,
        statusCode: 400,
        message: errors
      };
    }

    // ✅ normalize arrays
    if (body.language && !Array.isArray(body.language)) {
      body.language = [body.language];
    }

    if (
      body.existing_conditions &&
      !Array.isArray(body.existing_conditions)
    ) {
      body.existing_conditions = [body.existing_conditions];
    }

    if (body.allergies && !Array.isArray(body.allergies)) {
      body.allergies = [body.allergies];
    }

    // ✅ create profile
    const result = await userProfileModel.createUserProfile(
      userId,
      body
    );

    // ✅ already exists
    if (result?.success === false) {
      return {
        success: false,
        statusCode: 400,
        message: result.message
      };
    }

    // ✅ failed
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

    // Normalize Arrays
    if (body.language && !Array.isArray(body.language)) {
      body.language = [body.language];
    }

    if (
      body.existing_conditions &&
      !Array.isArray(body.existing_conditions)
    ) {
      body.existing_conditions = [body.existing_conditions];
    }

    if (
      body.allergies &&
      !Array.isArray(body.allergies)
    ) {
      body.allergies = [body.allergies];
    }

    // Validate Objects
    if (
      body.address &&
      (typeof body.address !== "object" || Array.isArray(body.address))
    ) {
      return {
        success: false,
        statusCode: 400,
        message: "Address must be an object."
      };
    }

    if (
      body.emergency_contact &&
      (typeof body.emergency_contact !== "object" ||
        Array.isArray(body.emergency_contact))
    ) {
      return {
        success: false,
        statusCode: 400,
        message: "Emergency contact must be an object."
      };
    }

    // Check Profile Exists
    const existingProfile =
      await userProfileModel.getUserProfileByUserId(userId);

    // CREATE
    if (!existingProfile) {
      const created =
        await userProfileModel.createUserProfile(userId, body);

      if (!created) {
        return {
          success: false,
          statusCode: 400,
          message: "Profile creation failed."
        };
      }

      return {
        success: true,
        statusCode: 201,
        message: "Profile created successfully.",
        data: {
          user_id: userId
        }
      };
    }

    // UPDATE
    const updated =
      await userProfileModel.updateUserProfile(userId, body);

    if (!updated) {
      return {
        success: false,
        statusCode: 400,
        message: "Profile update failed."
      };
    }

    return {
      success: true,
      statusCode: 200,
      message: "Profile updated successfully.",
      data: {
        user_id: userId
      }
    };

  } catch (error) {
    console.error("Update User Profile Service Error:", error);

    return {
      success: false,
      statusCode: 500,
      message: "Internal Server Error."
    };
  }
};

exports.getUserProfile = async (userId) => {
  try {

    if (!userId) {
      return {
        statusCode: 401,
        body: {
          message: "Unauthorized user."
        }
      };
    }

    const profile =
      await userProfileModel.getUserProfileByUserIds(userId);

    if (!profile) {
      return {
        statusCode: 404,
        body: {
          message: "User not found."
        }
      };
    }

    profile.language = safeParse(profile.language, []);
    profile.existing_conditions = safeParse(
      profile.existing_conditions,
      []
    );
    profile.allergies = safeParse(profile.allergies, []);
    profile.address = safeParse(profile.address, {});
    profile.emergency_contact = safeParse(
      profile.emergency_contact,
      {}
    );

    profile.image = profile.image_key
      ? {
          url: AWS_S3_BUCKET_URL
            ? `${AWS_S3_BUCKET_URL}/${encodeURI(profile.image_key)}`
            : `${APP_BASE_URL}/uploads/${encodeURI(profile.image_key)}`
        }
      : null;

    delete profile.image_key;

    return {
      statusCode: 200,
      body: {
        message: "User profile fetched successfully.",
        data: profile
      }
    };

  } catch (error) {
    console.error("Get User Profile Service Error:", error);

    return {
      statusCode: 500,
      body: {
        message: "Internal Server Error."
      }
    };
  }
};

exports.getPatientCardProfile = async (
  doctorId,
  patientId
) => {

  try {

    // Optional Security Check
    const isAssigned =
      await userProfileModel.checkDoctorPatientRelation(
        doctorId,
        patientId
      );

    if (!isAssigned) {
      return {
        success: false,
        statusCode: 403,
        message: "Access denied for this patient"
      };
    }

    const profile =
      await userProfileModel.getPatientCardProfile(
        patientId
      );

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

exports.getPatientDetails = async (doctorId, appointmentId) => {
  try {
    const patient = await userProfileModel.getPatientDetails(
      doctorId,
      appointmentId
    );

    if (!patient) {
      return {
        success: false,
        statusCode: 404,
        message: "Appointment not found",
      };
    }

    return {
      success: true,
      statusCode: 200,
      message: "Patient details fetched successfully",
      data: patient,
    };
  } catch (error) {
    console.error(error);

    return {
      success: false,
      statusCode: 500,
      message: "Something went wrong",
    };
  }
};

exports.getAllUsers = async () => {
  try {
    const users = await userProfileModel.getAllUsers();

    return {
      success: true,
      statusCode: 200,
      message: "Users fetched successfully",
      count: users.length,
      data: users.map((user) => ({
        ...user,
        language: safeParse(user.language),
        address: safeParse(user.address, {}),
        existing_conditions: safeParse(user.existing_conditions),
        allergies: safeParse(user.allergies),
        emergency_contact: safeParse(user.emergency_contact, {}),
      })),
    };
  } catch (error) {
    return {
      success: false,
      statusCode: 500,
      message: error.message,
    };
  }
};