const changePasswordService=
require("../../services/auth/changePasswordService");

const {
changePasswordValidation
}=require("../../validation/auth/passwordValidator");


exports.changePassword=async(req,res)=>{

try{

const error=
changePasswordValidation(req.body);


if(error)
return res.status(400).json({
success:false,
message:error
});


const userId=req.user?.id;


if(!userId)
return res.status(401).json({
success:false,
message:"Unauthorized"
});


const result=
await changePasswordService.changePassword(
userId,
req.body
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