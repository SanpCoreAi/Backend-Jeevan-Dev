const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../../models/usermodel");
const db = require("../../config/db");


exports.loginUser = async ({ email, password }) => {
  try {
    const user = await User.findByEmail(email);

    if (!user) {
      return {
        statusCode: 401,
        body: {
          success: false,
          message: "Invalid email or password",
        },
      };
    }

    if (!user.email_verified) {
      return {
        statusCode: 403,
        body: {
          success: false,
          message: "Email not verified. Please verify your email before logging in.",
        },
      };
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
  

    if (!isPasswordValid) {
      return {
        statusCode: 401,
        body: {
          success: false,
          message: "Invalid email or password",
        },
      };
    }
const accessToken = jwt.sign(
  { id: user.id, role_id: user.role_id },
  process.env.ACCESS_SECRET || "ACCESS_SECRET",
  { expiresIn: "15m" }
);

const refreshToken = jwt.sign(
  { id: user.id },
  process.env.REFRESH_SECRET || "REFRESH_SECRET",
  { expiresIn: "7d" }
);


    await db.query(
  "UPDATE users SET refresh_token = ? WHERE id = ?",
  [refreshToken, user.id]
);

   return {
  statusCode: 200,
  body: {
    success: true,
    message: "Login successful.",
    accessToken,
    refreshToken,
    user: {
      id: user.id,
      name: user.full_name,
      email: user.email,
      mobile: user.phone_number,
      role_id: user.role_id,
    },
  },  
};
  } catch (error) {
    console.error("Error (loginUser):", error.message);

    return {
      statusCode: 500,
      body: {
        success: false,
        message: "Unexpected login failure",
        error: error.message,
      },
    };
  }
};