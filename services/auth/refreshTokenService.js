const jwt = require("jsonwebtoken");

const User = require("../../models/usermodel");

exports.refreshToken = async (
  refreshToken
) => {

  try {

    if (
      !process.env.ACCESS_SECRET ||
      !process.env.REFRESH_SECRET
    ) {
      throw new Error(
        "JWT Secret Missing"
      );
    }

    const decoded =
      jwt.verify(
        refreshToken,
        process.env.REFRESH_SECRET
      );

    const user =
      await User.findByRefreshToken(
        decoded.id,
        refreshToken
      );

    if (!user) {

      return {
        statusCode:403,
        body:{
          message:
          "Invalid refresh token"
        }

      };

    }

    if (
      user.status &&
      user.status !== "ACTIVE"
    ) {

      return {
        statusCode:403,
        body:{
          message:
          "Account is inactive"
        }

      };

    }

    const accessToken =
      jwt.sign(

        {

          id:user.id,
          role_id:user.role_id,
          doctor_id:user.doctor_id

        },

        process.env.ACCESS_SECRET,

        {

          expiresIn:
          process.env.ACCESS_TOKEN_EXPIRE

        }

      );

    const newRefreshToken =
      jwt.sign(

        {

          id:user.id

        },

        process.env.REFRESH_SECRET,

        {

          expiresIn:
          process.env.REFRESH_TOKEN_EXPIRE

        }

      );

    await User.updateRefreshToken(

      user.id,

      newRefreshToken

    );

    return {

      statusCode:200,

      body:{

        message:
        "Token refreshed successfully",
        accessToken,
        refreshToken:
        newRefreshToken

      }

    };

  } catch(error){

    console.error(
      "Refresh Token Service Error:",
      error
    );

    return {

      statusCode:403,

      body:{
        message:
        "Invalid or expired refresh token"
      }
    };

  }

};