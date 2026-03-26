const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const User = require("../../models/usermodel");
const { sendVerificationEmail } = require("../../utils/sendEmail");

exports.registerUserOrAssistant = async (data) => {
  const { full_name, email, phone_number, password, role_id, doctor_id } = data;

  try {
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return {
        statusCode: 409,
        body: { message: "Email already registered" }
      };
    }

    const existingPhone = await User.findByPhone(phone_number);
    if (existingPhone) {
      return {
        statusCode: 409,
        body: { message: "Phone number already registered" }
      };
    }

    if (doctor_id) {
      const hashedDefaultPassword = await bcrypt.hash("assistant@123", 10);

      const userId = await User.createUser({
        full_name,
        email,
        phone_number,
        password: hashedDefaultPassword,
        doctor_id,
        role_id: role_id || 3,
        verificationToken: null,
        email_verified: 1,
      });

      return {
        statusCode: 201,
        body: {
          message: "Doctor assistant registered successfully.",
          user_id: userId,
        },
      };
    }

    if (!password) {
      return {
        statusCode: 400,
        body: { message: "Password is required for normal user registration" }
      };
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const verificationToken = crypto.randomBytes(32).toString("hex");

    const userId = await User.createUser({
      full_name,
      email,
      phone_number,
      password: hashedPassword,
      doctor_id: null,
      role_id: role_id || 2,
      verificationToken,
      email_verified: 0,
    });

    await sendVerificationEmail(email, verificationToken);

    return {
      statusCode: 201,
      body: {
        message: "Registration successful. Please verify your email.",
        user_id: userId,
      },
    };

  } catch (error) {
    return {
      statusCode: 500,
      body: { message: "User registration failed: " + error.message }
    };
  }
};

exports.getUserByDoctorId = async (doctor_id) => {
  try {
    const users = await User.findByDoctorId(doctor_id);

    if (!users || users.length === 0) {
      return {
        statusCode: 404,
        body: {
          message: "No assistants found for this doctor.",
          data: [],
        },
      };
    }

    return {
      statusCode: 200,
      body: {
        message: "Assistants fetched successfully.",
        results: users.length,
        data: users,
      },
    };

  } catch (error) {
    return {
      statusCode: 500,
      body: { message: "Fetching doctor assistants failed: " + error.message }
    };
  }
};

exports.verifyEmail = async (token) => {
  try {
    if (!token) {
      return {
        statusCode: 400,
        body: { message: "Verification token is missing" }
      };
    }

    const user = await User.verifyUserByToken(token);
    if (!user) {
      return {
        statusCode: 400,
        body: { message: "Invalid or expired verification token" }
      };
    }

    await User.markEmailVerified(user.id);

    return {
      statusCode: 200,
      body: { message: "Email verified successfully." }
    };

  } catch (error) {
    return {
      statusCode: 500,
      body: { message: "Email verification failed: " + error.message }
    };
  }
};

exports.getUsers = async (filters = {}) => {
  try {
    const users = await User.findUsers(filters);

    if (!users || users.length === 0) {
      return {
        statusCode: 404,
        body: {
          message: "No users found.",
          results: 0,
          data: [],
        },
      };
    }

    return {
      statusCode: 200,
      body: {
        message: "Users fetched successfully.",
        results: users.length,
        data: users,
      },
    };

  } catch (error) {
    return {
      statusCode: 500,
      body: { message: "Fetching users failed: " + error.message }
    };
  }
};
