const crypto=require("crypto");
const User=require("../../models/usermodel");

const {
sendResetPasswordEmail
}=require("../../utils/sendEmail");



exports.forgotPassword=async(email)=>{

try{
const user=
await User.findByEmail(email);

if(!user){

return {
statusCode:200,
body:{
message:
"If email exists, reset link sent"
}

};

}



const token =
crypto.randomBytes(32)
.toString("hex");



const tokenHash =
crypto
.createHash("sha256")
.update(token)
.digest("hex");



const expiry =
new Date(
Date.now()+15*60*1000
);



await User.saveResetToken(

user.id,

tokenHash,

expiry

);



await sendResetPasswordEmail(
email,
token
);



return {

statusCode:200,

body:{
message:
"If email exists, reset link sent"
}

};



}catch(error){

return {

statusCode:500,

body:{
message:error.message
}

};
}
};