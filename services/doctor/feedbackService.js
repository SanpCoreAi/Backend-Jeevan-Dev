const FeedbackModel=require("../../models/feedbackModel");
const xss=require("xss");


exports.createFeedback=async(userId,doctorId,body)=>{

try{

if(!userId)
return {
statusCode:401,
body:{message:"User not authenticated"}
};


if(!doctorId)
return {
statusCode:400,
body:{message:"doctor_id required"}
};


let {
feedback_text,
rating
}=body;


feedback_text=xss(feedback_text.trim());
rating=rating?Number(rating):null;


if(rating && (rating<1||rating>5))
return {
statusCode:400,
body:{message:"Rating must be between 1-5"}
};



const exists=
await FeedbackModel.checkUserFeedback(
userId,
doctorId
);


if(exists)
return {
statusCode:409,
body:{message:"Feedback already submitted"}
};



await FeedbackModel.createFeedback(
userId,
doctorId,
feedback_text,
rating
);



const feedbacks=
await FeedbackModel.getDoctorFeedbacks(
doctorId
);



const ratings=
feedbacks.filter(
f=>f.rating!==null
);



const avg_rating=
ratings.length
?
(
ratings.reduce(
(sum,f)=>sum+Number(f.rating),
0
)/ratings.length
).toFixed(1)
:0;



await FeedbackModel.saveDoctorRatingSummary(
doctorId,
feedbacks.length,
ratings.length,
avg_rating
);



return {

statusCode:201,

body:{

message:"Feedback created successfully",

data:{
 feedback_id: await FeedbackModel.createFeedback(
  userId,
  doctorId,
  feedback_text,
  rating
 )
}

}

};



}catch(error){

return {
statusCode:500,
body:{message:error.message}
};

}

};


exports.getDoctorFeedbacks=async(doctorId)=>{

try{


if(!doctorId)
return {
statusCode:400,
body:{message:"doctor_id required"}
};



const feedbacks=
await FeedbackModel.getDoctorFeedbacks(
doctorId
);



if(!feedbacks.length)
return {
statusCode:404,
body:{message:"No feedback found"}
};



const ratings=
feedbacks.filter(
f=>f.rating!==null
);



const avg_rating=
ratings.length
?
(
ratings.reduce(
(sum,f)=>sum+Number(f.rating),
0
)/ratings.length
).toFixed(1)
:0;



return {
statusCode:200,
body:{
message:"Feedback fetched successfully",
summary:{
total_feedbacks:feedbacks.length,
total_ratings:ratings.length,
avg_rating
},
data:feedbacks
}
};



}catch(error){

return {
statusCode:500,
body:{message:error.message}
};

}

};

exports.getAllFeedbacks=async()=>{

try{

const data=
await FeedbackModel.getAllFeedbacks();


return {
statusCode:200,
body:{
message:"All feedback fetched successfully",
data
}
};


}catch(error){

return {
statusCode:500,
body:{message:error.message}
};

}

};

exports.getAllDoctorsRatings=async()=>{

try{

const data=
await FeedbackModel.getAllDoctorsRatingSummary();


return {
statusCode:200,
body:{
message:"Doctor ratings fetched successfully",
data
}
};


}catch(error){

return {
statusCode:500,
body:{message:error.message}
};

}

};