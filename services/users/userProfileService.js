const userProfileModel = require("../../models/userProfileModel");
const { validateUserProfile } = require("../../validation/user/userProfile");

const AWS_S3_BUCKET_URL = process.env.AWS_S3_BUCKET_URL;
const APP_BASE_URL = process.env.APP_BASE_URL;

const safeParse = (value, defaultValue) => {
  if (!value) return defaultValue;

  try {
    return typeof value === "string"
      ? JSON.parse(value)
      : value;
  } catch {
    return defaultValue;
  }
};

exports.getUserProfile = async (userId) => {
  try {
    if (!userId) {
      return {
        success: false,
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
        success: false,
        statusCode: 404,
        body: {
          message: "User profile not found."
        }
      };
    }

    profile.language = safeParse(profile.language, []);
    profile.address = safeParse(profile.address, {});
    profile.existing_conditions = safeParse(
      profile.existing_conditions,
      []
    );
    profile.allergies = safeParse(
      profile.allergies,
      []
    );
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
      success: true,
      statusCode: 200,
      body: {
        message: "User profile fetched successfully.",
        data: profile
      }
    };

  } catch (error) {
    console.error(
      "Get User Profile Service Error:",
      error
    );

    return {
      success: false,
      statusCode: 500,
      body: {
        message: "Internal Server Error."
      }
    };
  }
};

exports.updateUserProfile = async (
  userId,
  body
) => {
  try {

    if (!userId) {
      return {
        success: false,
        statusCode: 401,
        body: {
          message: "Unauthorized user."
        }
      };
    }

    if (
      !body ||
      Object.keys(body).length === 0
    ) {
      return {
        success: false,
        statusCode: 400,
        body: {
          message:
            "At least one field is required."
        }
      };
    }

    const validationError =
      validateUserProfile(body);

    if (validationError) {
      return {
        success: false,
        statusCode: 400,
        body: {
          message: validationError
        }
      };
    }

    if (
      body.language &&
      !Array.isArray(body.language)
    ) {
      body.language = [body.language];
    }

    if (
      body.existing_conditions &&
      !Array.isArray(
        body.existing_conditions
      )
    ) {
      body.existing_conditions = [
        body.existing_conditions,
      ];
    }

    if (
      body.allergies &&
      !Array.isArray(body.allergies)
    ) {
      body.allergies = [
        body.allergies,
      ];
    }

    const existingProfile =
      await userProfileModel.getUserProfileByUserId(
        userId
      );

    if (!existingProfile) {

      const created =
        await userProfileModel.createUserProfile(
          userId,
          body
        );

      if (!created) {
        return {
          success: false,
          statusCode: 500,
          body: {
            message:
              "Failed to create profile."
          }
        };
      }

      return {
        success: true,
        statusCode: 201,
        body: {
          message:
            "Profile created successfully.",
          data: {
            user_id: userId
          }
        }
      };
    }

    // UPDATE PROFILE
    const updated =
      await userProfileModel.updateUserProfile(
        userId,
        body
      );

    if (!updated) {
      return {
        success: false,
        statusCode: 500,
        body: {
          message:
            "Failed to update profile."
        }
      };
    }

    return {
      success: true,
      statusCode: 200,
      body: {
        message:
          "Profile updated successfully.",
        data: {
          user_id: userId
        }
      }
    };

  } catch (error) {

    console.error(
      "Update User Profile Service Error:",
      error
    );

    return {
      success: false,
      statusCode: 500,
      body: {
        message:
          "Internal Server Error."
      }
    };
  }
};

exports.getPatientCardProfile = async (
  doctorId,
  patientId
) => {

  try {

    if (!doctorId) {
      return {
        success: false,
        statusCode: 401,
        body: {
          message: "Unauthorized doctor."
        }
      };
    }

    if (!patientId) {
      return {
        success: false,
        statusCode: 400,
        body: {
          message: "Patient id is required."
        }
      };
    }

    // Check doctor has access to this patient
    const isAssigned =
      await userProfileModel.checkDoctorPatientRelation(
        doctorId,
        patientId
      );

    if (!isAssigned) {
      return {
        success: false,
        statusCode: 403,
        body: {
          message:
            "You are not authorized to access this patient."
        }
      };
    }

    // Fetch patient profile
    const patient =
      await userProfileModel.getPatientCardProfile(
        patientId
      );

    if (!patient) {
      return {
        success: false,
        statusCode: 404,
        body: {
          message: "Patient profile not found."
        }
      };
    }

    return {
      success: true,
      statusCode: 200,
      body: {
        message:
          "Patient profile fetched successfully.",
        data: patient
      }
    };

  } catch (error) {

    console.error(
      "Get Patient Card Profile Service Error:",
      error
    );

    return {
      success: false,
      statusCode: 500,
      body: {
        message:
          "Internal Server Error."
      }
    };

  }

};

exports.getPatientDetails = async (
  doctorId,
  appointmentId
) => {

  try {

    // Authentication
    if (!doctorId) {
      return {
        success: false,
        statusCode: 401,
        body: {
          message: "Unauthorized doctor."
        }
      };
    }

    // Validation
    if (!appointmentId) {
      return {
        success: false,
        statusCode: 400,
        body: {
          message: "Appointment ID is required."
        }
      };
    }

    // Fetch Patient Details
    const patient =
      await userProfileModel.getPatientDetails(
        doctorId,
        appointmentId
      );

    if (!patient) {
      return {
        success: false,
        statusCode: 404,
        body: {
          message: "Patient details not found."
        }
      };
    }

    return {
      success: true,
      statusCode: 200,
      body: {
        message: "Patient details fetched successfully.",
        data: patient
      }
    };

  } catch (error) {

    console.error(
      "Get Patient Details Service Error:",
      error
    );

    return {
      success: false,
      statusCode: 500,
      body: {
        message: "Internal Server Error."
      }
    };

  }

};

exports.getAllUsers = async () => {

  try {

    const users =
      await userProfileModel.getAllUsers();

    if (!users || users.length === 0) {

      return {
        success: true,
        statusCode: 200,
        body: {
          message: "No users found.",
          count: 0,
          data: []
        }
      };

    }

    const formattedUsers = users.map((user) => ({

      ...user,

      language: safeParse(
        user.language,
        []
      ),

      address: safeParse(
        user.address,
        {}
      ),

      existing_conditions: safeParse(
        user.existing_conditions,
        []
      ),

      allergies: safeParse(
        user.allergies,
        []
      ),

      emergency_contact: safeParse(
        user.emergency_contact,
        {}
      )

    }));

    return {

      success: true,

      statusCode: 200,

      body: {

        message:
          "Users fetched successfully.",

        count:
          formattedUsers.length,

        data:
          formattedUsers

      }

    };

  } catch (error) {

    console.error(
      "Get All Users Service Error:",
      error
    );

    return {

      success: false,

      statusCode: 500,

      body: {

        message:
          "Internal Server Error."

      }

    };

  }

};

