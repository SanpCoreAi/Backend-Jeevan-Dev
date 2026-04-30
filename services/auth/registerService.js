const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const User = require("../../models/usermodel");
const { sendVerificationEmail } = require("../../utils/sendEmail");

exports.registerUserOrAssistant = async (data) => {
  try {
    const { full_name, email, phone_number, password, role_id, doctor_id } = data;

    const emailExists = await User.findByEmail(email);
    if (emailExists) {
      return { 
        statusCode: 409, body: 
        { 
          message: "Email already exists" 
        } };
    }


    const phoneExists = await User.findByPhone(phone_number);
    if (phoneExists) {
      return { statusCode: 409, body: { 
        message: "Phone already exists" 
      } };
    }

    if (doctor_id) {
      const defaultPassword = process.env.DEFAULT_ASSISTANT_PASSWORD || "ChangeMe@123";
      const hashedPassword = await bcrypt.hash(defaultPassword, 10);

      const userId = await User.createUser({
        full_name,
        email,
        phone_number,
        password: hashedPassword,
        doctor_id,
        role_id: role_id || 3,
        email_verified: 1,
      });

      return {
        statusCode: 201,
        body: {
          message: "Assistant created successfully",
          user_id: userId,
        },
      };
    }

    if (!password) {
      return { statusCode: 400, body: { message: "Password is required" } };
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const verificationToken = crypto.randomBytes(32).toString("hex");

    const userId = await User.createUser({
      full_name,
      email,
      phone_number,
      password: hashedPassword,
      role_id: role_id || 2,
      verificationToken,
      email_verified: 0,
    });

    try {
      await sendVerificationEmail(email, verificationToken);
      return {
        statusCode: 201,
        body: {
          message: "User registered. Please verify email.",
          user_id: userId,
        },
      };
    } catch (emailError) {
      console.error("Verification email send failed:", emailError.message);
      return {
        statusCode: 201,
        body: {
          message: "User registered, but verification email could not be sent. Please contact support.",
          user_id: userId,
          email_error: emailError.message,
        },
      };
    }

  } catch (error) {
    return {
      statusCode: 500,
      body: { message: "Registration failed: " + error.message },
    };
  }
};


exports.verifyEmail = async (token) => {
  try {
    if (!token) {
      return { statusCode: 400, body: { message: "Token missing" } };
    }

    const user = await User.verifyUserByToken(token);

    if (!user) {
      return { statusCode: 400, body: { message: "Invalid or expired token" } };
    }

    await User.markEmailVerified(user.id);

    return {
      statusCode: 200,
      body: { message: "Email verified successfully" },
    };

  } catch (error) {
    return {
      statusCode: 500,
      body: { message: "Verification failed: " + error.message },
    };
  }
};


exports.getUserByDoctorId = async (doctor_id) => {
  try {
    if (!doctor_id) {
      return { statusCode: 400, body: { message: "doctor_id required" } };
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
      body: { message: error.message },
    };
  }
};

exports.getUsers = async (filters) => {
  try {
    const page = filters.page || 1;
    const limit = filters.limit || 10;
    const offset = (page - 1) * limit;

    const users = await User.findUsers(filters, limit, offset);

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
      body: { message: error.message },
    };
  }
};