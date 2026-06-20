const FeedbackModel = require("../../models/feedbackModel");

exports.createFeedback = async(
 userId,
 doctorId,
 body
)=>{


 const {
  feedback_text,
  rating
 } = body;



 if(!userId){

  return {
   success:false,
   message:"User not authenticated"
  };

 }


 if(!doctorId){

  return {
   success:false,
   message:"doctor_id required"
  };

 }



 if(!feedback_text){

  return {
   success:false,
   message:"feedback_text required"
  };

 }



 if(
  rating &&
  (rating < 1 || rating > 5)
 ){

  return {
   success:false,
   message:"Rating must be between 1-5"
  };

 }



 await FeedbackModel.createFeedback(

  userId,
  doctorId,
  feedback_text,
  rating || null

 );



 const feedbacks =
 await FeedbackModel.getDoctorFeedbacks(
  doctorId
 );



 const total_feedbacks =
 feedbacks.length;


 const ratings =
 feedbacks.filter(
  item => item.rating != null
 );


 const total_ratings =
 ratings.length;



 const avg_rating =
 total_ratings

 ?
 (
  ratings.reduce(
   (sum,item)=>
   sum + Number(item.rating),
   0
  )
  /
  total_ratings
 ).toFixed(1)

 :
 0;



 await FeedbackModel.saveDoctorRatingSummary(
  doctorId,
  total_feedbacks,
  total_ratings,
  avg_rating
 );



 return {

  success:true,

  message:
  "Feedback created successfully"

 };

};




exports.getDoctorFeedbacks = async(
 doctorId
)=>{


 if(!doctorId){

  return {
   success:false,
   message:"doctor_id required"
  };

 }



 const feedbacks =
 await FeedbackModel.getDoctorFeedbacks(
  doctorId
 );



 if(!feedbacks.length){

  return {
   success:false,
   message:"No feedback found"
  };

 }



 return {

  success:true,

  data:feedbacks

 };

};

exports.getAllFeedbacks = async()=>{


 const data =
 await FeedbackModel.getAllFeedbacks();



 if(!data.length){

  return {
   success:false,
   message:"No feedback found"
  };

 }


 return {

  success:true,

  data

 };

};





exports.getDoctorFeedbacks = async(doctorId)=>{


 if(!doctorId){

  return {

   success:false,

   message:"doctor_id required"

  };

 }



 const feedbacks =
 await FeedbackModel.getDoctorFeedbacks(
  doctorId
 );



 if(!feedbacks.length){

  return {

   success:false,

   message:"No feedback found"

  };

 }



 const ratings =
 feedbacks.filter(
  f =>
  f.rating !== null
 );



 const total_feedbacks =
 feedbacks.length;



 const total_ratings =
 ratings.length;



 const avg_rating =
 total_ratings

 ?

 (
 ratings.reduce(
  (sum,f)=>
   sum + Number(f.rating),
  0
 )
 /
 total_ratings

 ).toFixed(1)

 :

 0;




 return {

  success:true,

  summary:{

   total_feedbacks,

   total_ratings,

   avg_rating

  },

  feedbacks

 };

};






exports.getAllDoctorsRatings = async()=>{


 const data =
 await FeedbackModel
 .getAllDoctorsRatingSummary();



 if(!data.length){

  return {

   success:false,

   message:"No ratings found"

  };

 }



 return {

  success:true,

  data

 };

};






// exports.createDoctorReply = async(
//  doctorId,
//  body
// )=>{


//  const {
//   feedback_id,
//   reply_text
//  } = body;



//  if(!doctorId){

//   return {

//    success:false,

//    message:"Doctor not authenticated"

//   };

//  }



//  if(!feedback_id || !reply_text){

//   return {

//    success:false,

//    message:
//    "feedback_id and reply_text required"

//   };

//  }



//  await FeedbackModel.createDoctorReply(

//   feedback_id,

//   doctorId,

//   reply_text

//  );



//  return {

//   success:true,

//   message:
//   "Reply added successfully"

//  };

// };