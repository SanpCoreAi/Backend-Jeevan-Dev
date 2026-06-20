const FeedbackService=require("../../services/doctor/feedbackService");
const {createFeedbackValidation}=require("../../validation/doctor/feedbackValidator");


exports.createFeedback=async(req,res)=>{
try{

const error=createFeedbackValidation(req.body);
if(error)
return res.status(400).json({success:false,message:error});


const userId=req.user?.id;
const doctorId=Number(req.params.doctorId);


const result=await FeedbackService.createFeedback(
userId,
doctorId,
req.body
);


return res.status(result.statusCode).json({
success:result.statusCode<400,
message:result.body.message,
data:result.body.data||{}
});


}catch(error){

return res.status(500).json({
success:false,
message:"Internal Server Error"
});

}
};


exports.getDoctorFeedbacks=async(req,res)=>{
try{

const doctorId=Number(req.params.doctor_id);


const result=
await FeedbackService.getDoctorFeedbacks(doctorId);


return res.status(result.statusCode).json({
success:result.statusCode<400,
message:result.body.message,
summary:result.body.summary||{},
data:result.body.data||[]
});


}catch(error){

return res.status(500).json({
success:false,
message:"Internal Server Error"
});

}
};

exports.getAllFeedbacks=async(req,res)=>{
try{

const result=
await FeedbackService.getAllFeedbacks();


return res.status(result.statusCode).json({
success:result.statusCode<400,
message:result.body.message,
data:result.body.data||[]
});


}catch(error){

return res.status(500).json({
success:false,
message:"Internal Server Error"
});

}
};

exports.getAllDoctorsRatings=async(req,res)=>{
try{

const result=
await FeedbackService.getAllDoctorsRatings();


return res.status(result.statusCode).json({
success:result.statusCode<400,
message:result.body.message,
data:result.body.data||[]
});


}catch(error){

return res.status(500).json({
success:false,
message:"Internal Server Error"
});

}
};