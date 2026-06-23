const bcrypt = require("bcryptjs");
const crypto = require("crypto");

const User = require("../../models/usermodel");

const { sendVerificationEmail, sendAssistantCredentials } = require("../../utils/sendEmail");

exports.registerUserOrAssistant = async (data) => {

try {

const {
 full_name,
 email,
 phone_number,
 password,
 role_id
} = data;


const emailExists = await User.findByEmail(email);

if(emailExists){
 return {
  statusCode:409,
  body:{
   message:"Email already exists"
  }
 };
}


const phoneExists = await User.findByPhone(phone_number);

if(phoneExists){
 return {
  statusCode:409,
  body:{
   message:"Phone already exists"
  }
 };
}



// =======================
// ASSISTANT REGISTER
// =======================

if(role_id == 3){


 const defaultPassword =
 process.env.DEFAULT_ASSISTANT_PASSWORD || "123456";


 const assistantPassword =
 password || defaultPassword;



 const hashedPassword =
 await bcrypt.hash(assistantPassword,10);



 const userId =
 await User.createUser({

  full_name,
  email,
  phone_number,
  password:hashedPassword,
  role_id:3,
  email_verified:1

 });



 await sendAssistantCredentials(
   email,
   full_name,
   assistantPassword
 );


 return {

  statusCode:201,

  body:{
   message:
   "Assistant created successfully. Credentials sent on email.",
   user_id:userId
  }

 };

}



// =======================
// NORMAL USER REGISTER
// =======================


if(!password){

 return {

 statusCode:400,

 body:{
  message:"Password is required"
 }

 };

}



const hashedPassword =
await bcrypt.hash(password,10);



const verificationToken =
crypto.randomBytes(32).toString("hex");



const userId =
await User.createUser({

 full_name,
 email,
 phone_number,
 password:hashedPassword,
 role_id:role_id || 2,
 verificationToken,
 email_verified:0

});



try{


await sendVerificationEmail(
 email,
 verificationToken
);



return {

statusCode:201,

body:{
 message:
 "User registered. Please verify email.",
 user_id:userId
}

};



}catch(error){


return {

statusCode:201,

body:{
 message:
 "User registered but verification email failed.",
 user_id:userId
}

};


}



}catch(error){


return {

statusCode:500,

body:{
 message:error.message
}

};


}

};

exports.verifyEmail = async (token) => {
  try {

    if (!token) {
      return {
        statusCode: 400,
        body: {
          message: "Token missing",
        },
      };
    }

    const user = await User.verifyUserByToken(token);

    if (!user) {
      return {
        statusCode: 400,
        body: {
          message: "Invalid or expired token",
        },
      };
    }

    await User.markEmailVerified(user.id);

    return {
      statusCode: 200,
      body: {
        message: "Email verified successfully",
      },
    };

  } catch (error) {

    return {
      statusCode: 500,
      body: {
        message: "Verification failed: " + error.message,
      },
    };
  }
};

exports.getUserByDoctorId = async (doctor_id) => {
  try {

    if (!doctor_id) {
      return {
        statusCode: 400,
        body: {
          message: "doctor_id required",
        },
      };
    }

    const users = await User.findByDoctorId(doctor_id);

    return {
      statusCode: 200,
      body: {
        message: "Users fetched successfully",
        results: users.length,
        data: users,
      },
    };

  } catch (error) {

    return {
      statusCode: 500,
      body: {
        message: error.message,
      },
    };
  }
};

exports.getUsers = async (filters) => {
  try {

    const page = filters.page || 1;
    const limit = filters.limit || 10;

    const offset = (page - 1) * limit;

    const users = await User.findUsers(
      filters,
      limit,
      offset
    );

    return {
      statusCode: 200,
      body: {
        message: "Users fetched successfully",
        results: users.length,
        data: users,
      },
    };

  } catch (error) {

    return {
      statusCode: 500,
      body: {
        message: error.message,
      },
    };
  }
};

exports.getAssistantStats = async (doctorId) => {
  try {
    const stats = await User.getAssistantStats(doctorId);

    return {
      statusCode: 200,
      body: {
        message: "Assistant status fetched successfully",
        data: stats,
      },
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: {
        message: error.message,
      },
    };
  }
};

exports.resendVerificationEmail = async (email) => {
  try {
    // Check if user exists
    const user = await User.findByEmail(email);
    
    if (!user) {
      return {
        statusCode: 404,
        body: {
          message: "User not found with this email address",
        },
      };
    }

    // Check if email is already verified
    if (user.email_verified === 1) {
      return {
        statusCode: 400,
        body: {
          message: "Email is already verified. Please login to continue.",
        },
      };
    }

    // Generate a new verification token
    const verificationToken = crypto.randomBytes(32).toString("hex");

    // Update user with new verification token
    await User.updateVerificationToken(user.id, verificationToken);

    try {
      // Send verification email
      await sendVerificationEmail(email, verificationToken);

      return {
        statusCode: 200,
        body: {
          message: "Verification email sent successfully. Please check your inbox.",
        },
      };

    } catch (emailError) {
      return {
        statusCode: 500,
        body: {
          message: "Failed to send verification email: " + emailError.message,
        },
      };
    }

  } catch (error) {
    return {
      statusCode: 500,
      body: {
        message: "Error: " + error.message,
      },
    };
  }
};