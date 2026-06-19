const FeedbackService = require("../../services/doctor/feedbackService");


exports.createFeedback = async (req, res) => {

  try {

    const userId = req.user?.id;

    const doctorId = Number(req.params.doctorId);


    const result =
      await FeedbackService.createFeedback(
        userId,
        doctorId,
        req.body
      );


    return res
      .status(result.success ? 201 : 400)
      .json(result);


  } catch(error){

    return res.status(500).json({
      success:false,
      message:error.message
    });

  }

};



exports.getDoctorFeedbacks = async(req,res)=>{

 try{

  const doctorId =
    Number(req.params.doctorId);


  const result =
    await FeedbackService.getDoctorFeedbacks(
      doctorId
    );


  return res
   .status(result.success ? 200 : 404)
   .json(result);


 }catch(error){

  return res.status(500).json({
    success:false,
    message:error.message
  });

 }

};



exports.getAllFeedbacks = async(req,res)=>{

 try{

  const result =
    await FeedbackService.getAllFeedbacks();


  return res
   .status(result.success ? 200 : 404)
   .json(result);


 }catch(error){

  return res.status(500).json({
    success:false,
    message:error.message
  });

 }

};


exports.getAllDoctorsRatings = async(req,res)=>{

 try{


  const result =
   await FeedbackService.getAllDoctorsRatings();


  return res
   .status(result.success ? 200 : 404)
   .json(result);



 }catch(error){

  return res.status(500).json({
    success:false,
    message:error.message
  });

 }

};




exports.createDoctorReply = async(req,res)=>{

 try{


  const doctorId =
    req.user.id;


  const result =
    await FeedbackService.createDoctorReply(
      doctorId,
      req.body
    );


  return res
   .status(result.success ? 201 : 400)
   .json(result);



 }catch(error){

  return res.status(500).json({
    success:false,
    message:error.message
  });

 }

};



module.exports = {
  createFeedback: exports.createFeedback,
  getAllFeedbacks: exports.getAllFeedbacks,
  getDoctorFeedbacks: exports.getDoctorFeedbacks,
  getAllDoctorsRatings: exports.getAllDoctorsRatings,
  createDoctorReply: exports.createDoctorReply,
};