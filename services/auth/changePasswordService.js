const bcrypt=require("bcryptjs");

const User=require("../../models/usermodel");


exports.changePassword=async(
userId,
data
)=>{


try{


const {
oldPassword,
newPassword
}=data;



const user=
await User.findById(userId);



if(!user){

return {

statusCode:404,

body:{
message:"User not found"
}

};

}



const match=
await bcrypt.compare(
oldPassword,
user.password
);



if(!match){

return {

statusCode:400,

body:{
message:"Old password incorrect"
}

};

}




if(
await bcrypt.compare(
newPassword,
user.password
)
){

return {

statusCode:400,

body:{
message:
"New password cannot be old password"
}

};

}





const hashPassword=
await bcrypt.hash(
newPassword,
12
);



await User.updatePassword(
userId,
hashPassword
);




return {

statusCode:200,

body:{

message:
"Password changed successfully"

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