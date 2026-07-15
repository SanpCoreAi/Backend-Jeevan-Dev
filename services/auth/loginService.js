const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const User = require("../../models/usermodel");

exports.loginUser = async ({ email, password }) => {
  try {

    if (
      !process.env.ACCESS_SECRET ||
      !process.env.REFRESH_SECRET
    ) {
      throw new Error("JWT secrets are missing");
    }

    email = email.trim().toLowerCase();
    password = password.trim();

    const user = await User.findByEmail(email);

    if (!user) {
      return {
        statusCode: 401,
        body: {
          message: "Invalid email or password",
        },
      };
    }

    if (user.email_verified !== 1) {
      return {
        statusCode: 403,
        body: {
          message: "Please verify your email first",
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
          message: "Your account is inactive. Please contact administrator.",
        },
      };
    }

    const isPasswordMatched = await bcrypt.compare(
      password,
      user.password
    );

    if (!isPasswordMatched) {

      console.warn(`Failed login attempt: ${email}`);

      return {
        statusCode: 401,
        body: {
          message: "Invalid email or password",
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

    const refreshToken = jwt.sign(
      {
        id: user.id,
      },
      process.env.REFRESH_SECRET,
      {
        expiresIn:
          process.env.REFRESH_TOKEN_EXPIRE || "7d",
      }
    );

    await User.updateRefreshToken(
      user.id,
      refreshToken
    );

    return {
      statusCode: 200,
      body: {
        message: "Login successful",
        data: {
          accessToken,
          refreshToken,
          user: {
            id: user.id,
            full_name: user.full_name,
            email: user.email,
            phone_number: user.phone_number,
            role_id: user.role_id,
            doctor_id: user.doctor_id || null,
          },
        },
      },
    };

  } catch (error) {

    console.error(
      "Login Service Error:",
      error
    );

    return {
      statusCode: 500,
      body: {
        message: "Internal Server Error",
      },
    };
  }
};