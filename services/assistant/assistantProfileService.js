const AssistantProfile=require("../../models/assistant/assistantProfileModel");
const xss=require("xss");

const AWS_S3_BUCKET_URL = process.env.AWS_S3_BUCKET_URL;
const APP_BASE_URL = process.env.APP_BASE_URL;

const safeParse = (value, defaultValue) => {
  try {
    return value ? JSON.parse(value) : defaultValue;
  } catch {
    return defaultValue;
  }
};


const sanitize=(data)=>{
Object.keys(data).forEach(key=>{
if(typeof data[key]=="string")
data[key]=xss(data[key].trim());
});
return data;
};



exports.createAssistantProfile=async(data)=>{
try{

const {user_id}=data;

if(!user_id)
return {
statusCode:401,
body:{message:"Unauthorized"}
};


const exists=await AssistantProfile.hasAssistantProfile(user_id);

if(exists)
return {
statusCode:409,
body:{message:"Assistant profile already exists"}
};


data=sanitize(data);


const profileId=
await AssistantProfile.createAssistantProfile(data);


return {
statusCode:201,
body:{
message:"Assistant profile created successfully",
profileId
}
};


}catch(error){

return {
statusCode:500,
body:{message:error.message}
};

}
};

exports.getAssistantProfile = async (userId) => {
  try {

    if (!userId) {
      return {
        statusCode: 401,
        body: {
          message: "Unauthorized"
        }
      };
    }

    const profile =
      await AssistantProfile.getAssistantProfile(userId);

    if (!profile) {
      return {
        statusCode: 404,
        body: {
          message: "Assistant not found"
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
    console.error(error);

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

    const profile =
      await AssistantProfile.getAssistantProfileByUserId(userId);

    // CREATE
    if (!profile) {

      const created =
        await AssistantProfile.createAssistantProfile(
          userId,
          data
        );

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
        message: "Assistant profile created successfully."
      };
    }

    // UPDATE
    const updated =
      await AssistantProfile.updateAssistantProfile(
        userId,
        data
      );

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
      message: "Assistant profile updated successfully."
    };

  } catch (error) {

    console.error(error);

    return {
      success: false,
      statusCode: 500,
      message: "Internal Server Error"
    };
  }
};




exports.getAllAssistantProfiles=async(doctorId)=>{
try{

const profiles=
await AssistantProfile.getAllAssistantProfiles(
doctorId
);


return {
statusCode:200,
body:{
message:"Assistant profiles fetched successfully",
results:profiles.length,
data:profiles
}
};


}catch(error){

return {
statusCode:500,
body:{message:error.message}
};

}
};

exports.getAllAssistantProfiles = async (doctorId) => {
  try {

    const profiles =
      await AssistantProfile.getAllAssistantProfiles(doctorId);

    return {
      statusCode: 200,
      body: {
        message: "Assistant profiles fetched successfully",
        results: profiles.length,
        data: profiles
      }
    };

  } catch (error) {

    return {
      statusCode: 500,
      body: { message: error.message }
    };

  }
};