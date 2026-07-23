const AssistantProfile = require("../../models/assistant/assistantProfileModel");
const xss = require("xss");
const safeParse = require("../../utils/safeJson");

const AWS_S3_BUCKET_URL = process.env.AWS_S3_BUCKET_URL;
const APP_BASE_URL = process.env.APP_BASE_URL;


const sanitize = (data = {}) => {
  const sanitized = {};

  Object.keys(data).forEach((key) => {
    const value = data[key];

    if (typeof value === "string") {
      sanitized[key] = xss(value.trim());
    } else {
      sanitized[key] = value;
    }
  });

  return sanitized;
};

exports.getAssistantProfile = async (userId) => {
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
      await AssistantProfile.getAssistantProfile(userId);

    if (!profile) {
      return {
        statusCode: 404,
        body: {
          message: "Assistant profile not found."
        }
      };
    }

    profile.language = safeParse(profile.language, []);
    profile.address = safeParse(profile.address, {});

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
        message: "Assistant profile fetched successfully.",
        data: profile
      }
    };

  } catch (error) {

    console.error("GET ASSISTANT PROFILE SERVICE ERROR:", error);

    return {
      statusCode: 500,
      body: {
        message: "Internal Server Error"
      }
    };
  }
};

exports.updateAssistantProfile = async (userId, data) => {

  try {

    if (!userId) {
      return {
        success: false,
        statusCode: 401,
        message: "Unauthorized user."
      };
    }

    data = sanitize(data);

    if (!data || Object.keys(data).length === 0) {
      return {
        success: false,
        statusCode: 400,
        message: "At least one field is required."
      };
    }

    if (
      data.language &&
      !Array.isArray(data.language)
    ) {
      data.language = [data.language];
    }

    Object.keys(data).forEach((key) => {
      if (data[key] === undefined || data[key] === null) {
        delete data[key];
      }
    });

    if (Object.keys(data).length === 0) {
      return {
        success: false,
        statusCode: 400,
        message: "No valid fields provided."
      };
    }

    const existingProfile =
      await AssistantProfile.getAssistantProfileByUserId(userId);

    if (!existingProfile) {

      const created =
        await AssistantProfile.createAssistantProfile(
          userId,
          data
        );

      if (!created) {
        return {
          success: false,
          statusCode: 500,
          message: "Profile creation failed."
        };
      }

      const profile =
        await AssistantProfile.getAssistantProfile(userId);

      return {
        success: true,
        statusCode: 201,
        message: "Assistant profile created successfully.",
        data: profile
      };
    }

    const updated =
      await AssistantProfile.updateAssistantProfile(
        userId,
        data
      );

    if (!updated) {
      return {
        success: false,
        statusCode: 500,
        message: "Profile update failed."
      };
    }

    const profile =
      await AssistantProfile.getAssistantProfile(userId);

    return {
      success: true,
      statusCode: 200,
      message: "Assistant profile updated successfully.",
      data: profile
    };

  } catch (error) {

    console.error("UPDATE ASSISTANT PROFILE SERVICE ERROR:", error);

    return {
      success: false,
      statusCode: 500,
      message: "Internal Server Error"
    };
  }
};

exports.getAllAssistantProfiles = async (doctorId) => {

  try {

    if (!doctorId) {
      return {
        statusCode: 400,
        body: {
          message: "Doctor id is required."
        }
      };
    }

    const profiles =
      await AssistantProfile.getAllAssistantProfiles(doctorId);

    return {
      statusCode: 200,
      body: {
        message: "Assistant profiles fetched successfully.",
        results: profiles.length,
        data: profiles
      }
    };

  } catch (error) {

    console.error("GET ALL ASSISTANT PROFILE SERVICE ERROR:", error);

    return {
      statusCode: 500,
      body: {
        message: "Internal Server Error"
      }
    };
  }
};

exports.getAllAssistantProfile = async () => {

  try {

    const assistants =
      await AssistantProfile.getAllAssistantProfile();

    const data = assistants.map((assistant) => ({

      ...assistant,

      language: safeParse(
        assistant.language,
        []
      ),

      address: safeParse(
        assistant.address,
        {}
      ),

      image: assistant.image_key
        ? {
            url: AWS_S3_BUCKET_URL
              ? `${AWS_S3_BUCKET_URL}/${encodeURI(
                  assistant.image_key
                )}`
              : `${APP_BASE_URL}/uploads/${encodeURI(
                  assistant.image_key
                )}`
          }
        : null

    }));

    data.forEach(item => delete item.image_key);

    return {

      success: true,

      statusCode: 200,

      body: {

        message:
          "Assistant profiles fetched successfully.",

        count: data.length,

        data

      }

    };

  } catch (error) {

    console.error(
      "GET ALL ASSISTANT PROFILES SERVICE ERROR:",
      error
    );

    return {

      success: false,

      statusCode: 500,

      body: {

        message:
          "Internal Server Error"

      }

    };

  }

};