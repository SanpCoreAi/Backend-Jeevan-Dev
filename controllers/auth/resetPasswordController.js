const resetPasswordService=
require("../../services/auth/resetPasswordService");

const {
resetPasswordValidation
}=require("../../validation/auth/passwordValidator");


exports.resetPassword=async(req,res)=>{

try{

const error=
resetPasswordValidation(req.body);


if(error)
return res.status(400).json({
success:false,
message:error
});


const result=
await resetPasswordService.resetPassword(
req.body.token,
req.body.password
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