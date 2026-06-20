const crypto=require("crypto");
const bcrypt=require("bcryptjs");

const User=require("../../models/usermodel");


exports.resetPassword=async(
token,
password
)=>{


try{


const tokenHash=
crypto
.createHash("sha256")
.update(token)
.digest("hex");



const user=
await User.findUserByResetToken(
tokenHash
);



if(!user){

return {

statusCode:400,

body:{
message:
"Invalid or expired reset token"
}

};

}




if(
!user.reset_token_expiry ||
new Date(user.reset_token_expiry)
<
new Date()
){

return {

statusCode:400,

body:{
message:
"Reset token expired"
}

};

}




const hashPassword=
await bcrypt.hash(
password,
12
);



await User.updatePassword(

user.id,

hashPassword

);



await User.clearResetToken(
user.id
);



return {

statusCode:200,

body:{

message:
"Password reset successfully"

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