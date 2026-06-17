const assistantProfileService =
require("../../services/assistant/assistantProfileService");

exports.createAssistantProfile = async (req, res) => {
  try {

    const doctor_id = req.user.doctor_id || req.user.id;

    let user_id = req.body.user_id;

    if (req.user.role_id === 3) {
      user_id = req.user.id;
    }

    if (req.user.role_id === 2 && !user_id) {
      return res.status(400).json({
        success:false,
        message:"user_id is required"
      });
    }


    const result =
      await assistantProfileService.createAssistantProfile({
        ...req.body,
        doctor_id,
        user_id
      });


    return res.status(201).json(result);


  } catch(error){

    return res.status(500).json({
      success:false,
      message:error.message
    });

  }
};

exports.getAssistantProfile = async (req, res) => {
  try {

    const doctor_id =
      req.user.doctor_id || req.user.id;

    const result =
      await assistantProfileService.getAssistantProfile(
        doctor_id
      );

    if (!result.success) {
      return res.status(404).json(result);
    }

    return res.status(200).json(result);

  } catch (error) {

    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.getAllAssistantProfiles = async (req, res) => {
  try {

    const doctor_id =
      req.user.doctor_id || req.user.id;

    const result =
      await assistantProfileService.getAllAssistantProfiles(
        doctor_id
      );

    res.status(200).json(result);

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};