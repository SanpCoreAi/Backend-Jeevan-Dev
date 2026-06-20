const forgotPasswordService =
require("../../services/auth/forgotPasswordService");


const {
forgotPasswordValidation
}=require("../../validation/auth/passwordValidator");


exports.forgotPassword=async(req,res)=>{

try{

const error=
forgotPasswordValidation(req.body);


if(error)
return res.status(400).json({
success:false,
message:error
});


const result =
await forgotPasswordService.forgotPassword(
req.body.email
);


return res.status(result.statusCode).json({
success:result.statusCode<400,
message:result.body.message
});


}catch(error){

return res.status(500).json({
success:false,
message:"Internal Server Error"
});

}

};