const bcrypt = require("bcryptjs");
const crypto = require("crypto");

const User = require("../../models/usermodel");
const DoctorRegistrationModel = require("../../models/doctorVerification/doctorRegistrationModel");

const {
  sendVerificationEmail,
  sendAssistantCredentials,
  sendDoctorCredentials,
} = require("../../utils/sendEmail");

exports.registerUserOrAssistant = async (data) => {
  try {

    let {
      full_name,
      email,
      phone_number,
      password,
      role_id,
      doctor_id,
      registration_id,
    } = data;

    full_name = full_name.trim();
    email = email.trim().toLowerCase();
    phone_number = phone_number.trim();

    const existingEmail =
      await User.findByEmail(email);

    if (existingEmail) {
      return {
        statusCode: 409,
        body: {
          message: "Email already exists",
        },
      };
    }

    const existingPhone =
      await User.findByPhone(phone_number);

    if (existingPhone) {
      return {
        statusCode: 409,
        body: {
          message: "Phone number already exists",
        },
      };
    }

    const createAccount = async ({
      roleId,
      password,
      doctorId = null,
      registrationId = null,
      emailVerified = 1,
      verificationToken = null,
      status = "ACTIVE",
    }) => {

      const hashedPassword =
        await bcrypt.hash(
          password,
          10
        );

      return await User.createUser({
        full_name,
        email,
        phone_number,
        password: hashedPassword,
        doctor_id: doctorId,
        role_id: roleId,
        registration_id:
          registrationId,
        email_verified:
          emailVerified,
        verificationToken,
        status,
      });
    };

    if (role_id === 2) {

      if (!registration_id) {
        return {
          statusCode: 400,
          body: {
            message: "registration_id is required for doctor",
          },
        };
      }

      const doctorPassword =
        crypto.randomBytes(5).toString("hex");

      const userId =
        await createAccount({
          roleId: 2,
          password: doctorPassword,
          doctorId: null,
          registrationId: registration_id,
          status: "INACTIVE",
        });

      await DoctorRegistrationModel.updateOnboardingStatus(
        registration_id,
        "VERIFIED"
      );

      try {
        await sendDoctorCredentials(
          email,
          full_name,
          doctorPassword
        );
      } catch (err) {
        console.error(
          "Doctor Email Error:",
          err.message
        );
      }

      return {
        statusCode: 201,
        body: {
          message:
            "Doctor created successfully. Credentials sent to email.",
          user_id: userId,
          status: "INACTIVE",
        },
      };
    }

    if (role_id === 3) {
      if (!doctor_id) {
        return {
          statusCode: 400,
          body: {
            message:
              "Doctor id is required",
          },
        };
      }

      const assistantPassword =
        crypto.randomBytes(5).toString("hex");

      const userId =
        await createAccount({
          roleId: 3,
          password:
            assistantPassword,
          doctorId:
            doctor_id,
          registrationId:
            null,
          status: "ACTIVE",
        });

      try {

        await sendAssistantCredentials(
          email,
          full_name,
          assistantPassword
        );

      } catch (err) {

        console.error(
          "Assistant Email Error:",
          err.message
        );
      }

      return {
        statusCode: 201,
        body: {
          message:
            "Assistant created successfully. Credentials sent to email.",
          user_id:
            userId,
          status:
            "ACTIVE",
        },
      };
    }

    if (!password) {
      return {
        statusCode: 400,
        body: {
          message:
            "Password is required",
        },
      };
    }

    const verificationToken =
      crypto.randomBytes(32).toString("hex");
    const userId =
      await createAccount({
        roleId: 1,
        password,
        doctorId: null,
        registrationId: null,
        emailVerified: 0,
        verificationToken,
        status: "ACTIVE",
      });

    try {

      await sendVerificationEmail(
        email,
        verificationToken
      );

    } catch (err) {

      console.error(
        "Verification Email Error:",
        err.message
      );
    }

    return {
      statusCode: 201,
      body: {
        message:
          "User registered successfully. Please verify your email.",
        user_id:
          userId,
        status:
          "ACTIVE",
      },
    };

  } catch (error) {

    console.error(
      "Register Service Error:",
      error
    );
    return {
      statusCode: 500,
      body: {
        message:
          "Internal Server Error",
      },
    };
  }
};

exports.verifyEmail = async (token) => {
  try {

    if (!token || !token.trim()) {
      return {
        statusCode: 400,
        body: {
          message: "Verification token is required",
        },
      };
    }

    const user = await User.verifyUserByToken(token.trim());

    if (!user) {
      return {
        statusCode: 400,
        body: {
          message: "Invalid or expired verification token",
        },
      };
    }

    if (user.email_verified === 1) {
      return {
        statusCode: 400,
        body: {
          message: "Email is already verified",
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

    console.error("Verify Email Service Error:", error);

    return {
      statusCode: 500,
      body: {
        message: "Internal Server Error",
      },
    };
  }
};

exports.resendVerificationEmail = async (email) => {
  try {

    if (!email || !email.trim()) {
      return {
        statusCode: 400,
        body: {
          message: "Email is required",
        },
      };
    }

    email = email.trim().toLowerCase();

    const user = await User.findByEmail(email);

    if (!user) {
      return {
        statusCode: 404,
        body: {
          message: "User not found",
        },
      };
    }

    if (user.email_verified === 1) {
      return {
        statusCode: 400,
        body: {
          message: "Email is already verified",
        },
      };
    }

    const verificationToken =
      crypto.randomBytes(32).toString("hex");

    await User.updateVerificationToken(
      user.id,
      verificationToken
    );

    try {

      await sendVerificationEmail(
        email,
        verificationToken
      );

    } catch (emailError) {

      console.error(
        "Verification Email Error:",
        emailError
      );

      return {
        statusCode: 500,
        body: {
          message: "Unable to send verification email",
        },
      };
    }

    return {
      statusCode: 200,
      body: {
        message:
          "Verification email sent successfully. Please check your inbox.",
      },
    };

  } catch (error) {

    console.error(
      "Resend Verification Service Error:",
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

exports.getUserByDoctorId = async (doctorId) => {
  try {

    if (!doctorId) {
      return {
        statusCode: 400,
        body: {
          message: "Doctor id is required",
        },
      };
    }

    const users = await User.findByDoctorId(Number(doctorId));

    return {
      statusCode: 200,
      body: {
        message: "Users fetched successfully",
        results: users.length,
        data: users,
      },
    };

  } catch (error) {

    console.error("Get User By Doctor Id Service Error:", error);

    return {
      statusCode: 500,
      body: {
        message: "Internal Server Error",
      },
    };
  }
};

exports.getUsers = async (filters) => {
  try {

    const page = Number(filters.page) || 1;
    const limit = Number(filters.limit) || 10;
    const offset = (page - 1) * limit;

    const result = await User.findUsers(
      filters,
      limit,
      offset
    );

    return {
      statusCode: 200,
      body: {
        message: "Users fetched successfully",
        page,
        limit,
        totalRecords: result.total,
        totalPages: Math.ceil(result.total / limit),
        results: result.users.length,
        data: result.users,
      },
    };

  } catch (error) {

    return {
      statusCode: 500,
      body: {
        message: "Internal Server Error",
      },
    };
  }
};

exports.getAssistantStats = async (doctorId) => {
  try {

    if (!doctorId) {
      return {
        statusCode: 400,
        body: {
          message: "Doctor id is required",
        },
      };
    }

    const stats = await User.getAssistantStats(Number(doctorId));

    return {
      statusCode: 200,
      body: {
        message: "Assistant statistics fetched successfully",
        data: {
          totalAssistants: Number(stats.totalAssistants) || 0,
          yearAssistants: Number(stats.yearAssistants) || 0,
          monthAssistants: Number(stats.monthAssistants) || 0,
          weekAssistants: Number(stats.weekAssistants) || 0,
        },
      },
    };

  } catch (error) {

    console.error("Get Assistant Stats Service Error:", error);

    return {
      statusCode: 500,
      body: {
        message: "Internal Server Error",
      },
    };
  }
};