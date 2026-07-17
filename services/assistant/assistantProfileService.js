const AssistantProfile=require("../../models/assistant/assistantProfileModel");
const xss=require("xss");


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

    const profile = await AssistantProfile.getAssistantProfile(userId);

    if (!profile) {
      return {
        statusCode: 404,
        body: {
          message: "Assistant not found"
        }
      };
    }

    return {
      statusCode: 200,
      body: {
        message: "Assistant profile fetched successfully",
        data: profile
      }
    };

  } catch (error) {
    return {
      statusCode: 500,
      body: {
        message: error.message
      }
    };
  }
};


exports.updateAssistantProfile=async(userId,data)=>{
try{

data=sanitize(data);


const updated=
await AssistantProfile.updateAssistantProfile(
userId,
data
);


if(!updated)
return {
statusCode:400,
body:{message:"Profile update failed"}
};


return {
statusCode:200,
body:{
message:"Assistant profile updated successfully"
}
};


}catch(error){

return {
statusCode:500,
body:{message:error.message}
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