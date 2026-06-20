const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const User =
require("../../models/usermodel");

const db =
require("../../config/db");


exports.loginUser = async ({ email, password}) => {
 try {

  if(
      !process.env.ACCESS_SECRET ||
      !process.env.REFRESH_SECRET
    ){

      throw new Error(
        "JWT secret missing"
      );

    }

    email =
    email.toLowerCase().trim();

    const user =
      await User.findByEmail(email);

    if (!user) {

      return {
      statusCode:401,

        body:{
          message:
          "Invalid email or password"
        }
      };
    }
    if(!user.email_verified){

      return {

        statusCode:403,

        body:{

          message:
          "Please verify your email first"

        }
      };
    }

    const isMatch =
      await bcrypt.compare(
        password,
        user.password
      );

    if(!isMatch){
      console.log(
        `Failed login attempt for ${email}`
      );

      return {
        statusCode:401,
        body:{
          message:
          "Invalid email or password"
        }
      };
    }

    const accessToken =
      jwt.sign(

        {
          id:user.id,
          role_id:user.role_id
        },

        process.env.ACCESS_SECRET,
        
        {
          expiresIn:"15m"
        }

      );

    const refreshToken =
      jwt.sign(

        {
          id:user.id
        },

        process.env.REFRESH_SECRET,

        {
          expiresIn:"7d"
        }

      );

    await db.query(
      `
      UPDATE users
      SET refresh_token=?
      WHERE id=?
      `,

      [
        refreshToken,
        user.id
      ]

    );

    return {
      statusCode:200,

      body:{
      message:
        "Login successful",

   data:{
        accessToken,
        refreshToken,
        user:{
        id:user.id,
        full_name:user.full_name,
        email:user.email,
        phone_number:user.phone_number,
        role_id:user.role_id
       }
    }
  }
};

  } catch(error) {
    console.error(
      "LOGIN SERVICE ERROR:",
      error.message
    );
    return {
      statusCode:500,
      body:{
       message:
        error.message
      }
    };
  }
};