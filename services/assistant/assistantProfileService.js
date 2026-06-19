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


exports.getAssistantProfile = async (userId) => {

  const profile =
    await AssistantProfile.getAssistantProfile(userId);


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
    data: {

      // Top details
      user_id: userId,
      full_name: profile.full_name,
      email: profile.email,
      phone_number: profile.phone_number,

      // Profile details
      gender: profile.gender,
      age: profile.age,
      department: profile.department,
      education: profile.education,
      experience: profile.experience,
      language: profile.language,
      joining_date: profile.joining_date,
      address: profile.address,
      doctor_assign: profile.doctor_assign,
       bio: profile.bio,
    }
  };

};

exports.updateAssistantProfile = async (
  userId,
  data
) => {


  const result =
    await AssistantProfile.updateAssistantProfile(
      userId,
      data
    );


  if(!result){

    return {
      success:false,
      message:"Profile update failed"
    };

  }



  return {

    success:true,

    message:
    "Assistant profile updated successfully"

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