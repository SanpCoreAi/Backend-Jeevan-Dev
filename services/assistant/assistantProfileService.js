const AssistantProfile = require("../../models/assistant/assistantProfileModel");
const { safeJSON } = require("../../utils/safeJson");

const parseLanguage = (value) => {
  if (Array.isArray(value)) return value;
  if (typeof value === "string") {
    const trimmed = value.trim();
    const jsonParsed = safeJSON(trimmed, null);
    if (jsonParsed !== null) return jsonParsed;
    if (trimmed.length === 0) return [];
    return trimmed.split(",").map((item) => item.trim()).filter(Boolean);
  }
  return [];
};

exports.createAssistantProfile = async(data)=>{


 const profileId =
 await AssistantProfile.createAssistantProfile(data);


 return {
   success:true,
   message:"Assistant profile created successfully",
   profileId
 };

};


exports.getAssistantProfile = async (doctorId) => {

  const profile =
    await AssistantProfile.getAssistantProfile(
      doctorId
    );


  if (!profile) {
    return {
      success: false,
      message: "Profile not found"
    };
  }

  profile.language = parseLanguage(profile.language);
  profile.address = safeJSON(profile.address, {});

  return {
    success: true,
    data: profile
  };
};

exports.getAllAssistantProfiles = async (doctorId) => {

  console.log("[assistantProfileService] getAllAssistantProfiles doctorId=", doctorId);

  const profiles = await AssistantProfile.getAllAssistantProfiles(doctorId);

  console.log("[assistantProfileService] raw profiles count=", profiles?.length || 0);

  profiles.forEach((item) => {
    item.language = parseLanguage(item.language);
    item.address = safeJSON(item.address, {});
  });

  return {
    success: true,
    count: profiles.length,
    data: profiles
  };
};