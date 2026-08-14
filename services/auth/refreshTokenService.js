const jwt = require("jsonwebtoken");

const User = require("../../models/usermodel");

exports.refreshToken = async (refreshToken) => {
  try {

    if (
      !process.env.ACCESS_SECRET ||
      !process.env.REFRESH_SECRET
    ) {
      throw new Error("JWT Secret Missing");
    }

    if (!refreshToken) {
      return {
        statusCode: 401,
        body: {
          message: "Refresh token is required.",
        },
      };
    }

    const decoded = jwt.verify(
      refreshToken,
      process.env.REFRESH_SECRET
    );

    const user = await User.findByRefreshToken(
      decoded.id,
      refreshToken
    );

    if (!user) {
      return {
        statusCode: 403,
        body: {
          message: "Invalid refresh token.",
        },
      };
    }

    if (
      user.status &&
      user.status !== "ACTIVE"
    ) {
      return {
        statusCode: 403,
        body: {
          message: "Account is inactive.",
        },
      };
    }

    const accessToken = jwt.sign(
      {
        id: user.id,
        role_id: user.role_id,
        doctor_id: user.doctor_id || null,
      },
      process.env.ACCESS_SECRET,
      {
        expiresIn:
          process.env.ACCESS_TOKEN_EXPIRE || "1d",
      }
    );

    const newRefreshToken = jwt.sign(
      {
        id: user.id,
      },
      process.env.REFRESH_SECRET,
      {
        expiresIn:
          process.env.JWT_EXPIRES_IN || "7d",
      }
    );

    await User.updateRefreshToken(
      user.id,
      newRefreshToken
    );

    return {
      statusCode: 200,
      body: {
        message: "Token refreshed successfully.",
        accessToken,
        refreshToken: newRefreshToken,
      },
    };

  } catch (error) {
    console.error(
      "Refresh Token Service Error:",
      error
    );

    if (
      error.name === "JsonWebTokenError"
    ) {
      return {
        statusCode: 401,
        body: {
          message:
            "Invalid refresh token. Please login again.",
        },
      };
    }

    if (
      error.name === "TokenExpiredError"
    ) {
      return {
        statusCode: 401,
        body: {
          message:
            "Refresh token expired. Please login again.",
        },
      };
    }

    return {
      statusCode: 500,
      body: {
        message: "Internal Server Error.",
      },
    };
  }
};