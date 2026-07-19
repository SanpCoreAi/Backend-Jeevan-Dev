const assistantProfileService=require("../../services/assistant/assistantProfileService");
const {
createAssistantProfileValidation,
updateAssistantProfileValidation
}=require("../../validation/assistant/assistantProfileValidator");


exports.createAssistantProfile=async(req,res)=>{
try{

const error=createAssistantProfileValidation(req.body);
if(error)
return res.status(400).json({success:false,message:error});

const user_id=req.user?.id;

if(!user_id)
return res.status(401).json({success:false,message:"Unauthorized"});


const result=await assistantProfileService.createAssistantProfile({
...req.body,
user_id
});

return res.status(result.statusCode).json({
success:result.statusCode<400,
message:result.body.message,
data:{profile_id:result.body.profileId||null}
});

}catch(error){
return res.status(500).json({
success:false,
message:"Internal Server Error"
});
}
};



exports.getAssistantProfile = async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized"
      });
    }

    const result =
      await assistantProfileService.getAssistantProfile(userId);

    return res.status(result.statusCode).json({
      success: result.statusCode < 400,
      message: result.body.message,
      data: result.body.data || null
    });

  } catch (error) {
    console.error("Get Assistant Profile Error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error"
    });
  }
};


exports.updateAssistantProfile = async (req, res) => {
  try {
    const error = updateAssistantProfileValidation(req.body);

    if (error) {
      return res.status(400).json({
        success: false,
        message: error
      });
    }

    const result = await assistantProfileService.updateAssistantProfile(
      req.user.id,
      req.body
    );

    return res
      .status(result.statusCode || (result.success ? 200 : 400))
      .json(result);

  } catch (error) {
    console.error("Update Assistant Profile Error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error"
    });
  }
};

exports.getAllAssistantProfiles = async (req, res) => {
  try {
console.log("doctorId:", req.params.doctorId);
    const { doctorId } = req.params;

    if (!doctorId) {
      return res.status(400).json({
        success: false,
        message: "Doctor ID is required"
      });
    }

    const result = await assistantProfileService.getAllAssistantProfiles(
      doctorId
    );

    return res.status(result.statusCode).json({
      success: result.statusCode < 400,
      message: result.body.message,
      count: result.body.results || 0,
      data: result.body.data || []
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal Server Error"
    });
  }
};