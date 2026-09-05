const db = require("../../config/db");
const doctorRegistrationModel = require("../../models/doctorVerification/doctorRegistrationModel");
const { sendOtpEmail } = require("../../utils/sendEmail");
const path = require("path");
const { v4: uuidv4 } = require("uuid");
const {
  PutObjectCommand,
  DeleteObjectCommand,
} = require("@aws-sdk/client-s3");
const { upload } = require("../../middlewares/multer");
const { validateFile } = require("../../validation/upload/uploadFileValidation");

const s3 = require("../../config/s3");


const isRegistrationComplete = (registration) => {

  return Boolean(
    registration.full_name &&
    registration.gender &&
    registration.age &&
    registration.email &&
    registration.mobile &&
    registration.medical_registration_number &&
    registration.medical_council &&
    registration.qualification &&
    registration.specialization &&
    registration.registration_expiry_date &&
    registration.medical_registration_certificate &&
    registration.medical_degree_certificate &&
    registration.government_id_proof &&
    registration.selfie &&
    Number(registration.email_verified) === 1
  );
};


exports.createDoctorRegistration = async (body) => {

  let connection;

  try {

    connection = await db.getConnection();

    await connection.beginTransaction();

    const {
      registrationId,

      fullName,
      gender,
      age,
      email,
      mobile,

      medicalRegistrationNumber,
      medicalCouncil,
      qualification,
      specialization,
      registrationExpiryDate,
    } = body;

    if (!registrationId) {

      if (
        !fullName ||
        !gender ||
        !age ||
        !email ||
        !mobile
      ) {

        await connection.rollback();

        return {
          success: false,
          statusCode: 400,
          message:
            "Full name, gender, age, email and mobile are required to start registration.",
        };
      }

      const userEmailExists =
        await doctorRegistrationModel.findUserByEmail(
          email,
          connection
        );

      if (userEmailExists) {

        await connection.rollback();

        return {
          success: false,
          statusCode: 409,
          message:
            "Email already exists. Please use another email.",
        };
      }

      const userMobileExists =
        await doctorRegistrationModel.findUserByPhone(
          mobile,
          connection
        );

      if (userMobileExists) {

        await connection.rollback();

        return {
          success: false,
          statusCode: 409,
          message:
            "Mobile number already exists. Please use another mobile number.",
        };
      }

      const emailExists =
        await doctorRegistrationModel.findByEmail(
          email,
          connection
        );

      if (emailExists) {

        await connection.rollback();

        return {
          success: false,
          statusCode: 409,
          message:
            "Email already exists.",
        };
      }

      const mobileExists =
        await doctorRegistrationModel.findByMobile(
          mobile,
          connection
        );

      if (mobileExists) {

        await connection.rollback();

        return {
          success: false,
          statusCode: 409,
          message:
            "Mobile number already exists.",
        };
      }

      if (medicalRegistrationNumber) {

        const registrationExists =
          await doctorRegistrationModel
            .findByRegistrationNumber(
              medicalRegistrationNumber,
              connection
            );

        if (registrationExists) {

          await connection.rollback();

          return {
            success: false,
            statusCode: 409,
            message:
              "Medical registration number already exists.",
          };
        }
      }


      const newRegistrationId =
        await doctorRegistrationModel.create(
          {
            fullName,
            gender,
            age,
            email,
            mobile,

            medicalRegistrationNumber:
              medicalRegistrationNumber || null,

            medicalCouncil:
              medicalCouncil || null,

            qualification:
              qualification || null,

            specialization:
              specialization || null,

            registrationExpiryDate:
              registrationExpiryDate || null,
          },
          connection
        );


      await connection.commit();


      return {
        success: true,
        statusCode: 201,
        message:
          "Doctor registration draft created successfully.",
        data: {
          registrationId:
            newRegistrationId,

          onboarding_status:
            "DRAFT",
        },
      };
    }

    const existingRegistration =
      await doctorRegistrationModel.findById(
        registrationId,
        connection
      );


    if (!existingRegistration) {

      await connection.rollback();

      return {
        success: false,
        statusCode: 404,
        message:
          "Doctor registration not found.",
      };
    }


    if (
      existingRegistration.onboarding_status !==
      "DRAFT"
    ) {

      await connection.rollback();

      return {
        success: false,
        statusCode: 400,
        message:
          "Doctor registration cannot be updated after submission.",
      };
    }


    if (
      email &&
      email !== existingRegistration.email
    ) {

      const userEmailExists =
        await doctorRegistrationModel.findUserByEmail(
          email,
          connection
        );

      if (userEmailExists) {

        await connection.rollback();

        return {
          success: false,
          statusCode: 409,
          message:
            "Email already exists. Please use another email.",
        };
      }


      const emailExists =
        await doctorRegistrationModel
          .findByEmailExceptId(
            email,
            registrationId,
            connection
          );

      if (emailExists) {

        await connection.rollback();

        return {
          success: false,
          statusCode: 409,
          message:
            "Email already exists.",
        };
      }
    }

    if (
      mobile &&
      mobile !== existingRegistration.mobile
    ) {

      const userMobileExists =
        await doctorRegistrationModel.findUserByPhone(
          mobile,
          connection
        );

      if (userMobileExists) {

        await connection.rollback();

        return {
          success: false,
          statusCode: 409,
          message:
            "Mobile number already exists. Please use another mobile number.",
        };
      }


      const mobileExists =
        await doctorRegistrationModel
          .findByMobileExceptId(
            mobile,
            registrationId,
            connection
          );

      if (mobileExists) {

        await connection.rollback();

        return {
          success: false,
          statusCode: 409,
          message:
            "Mobile number already exists.",
        };
      }
    }


    if (
      medicalRegistrationNumber &&
      medicalRegistrationNumber !==
        existingRegistration
          .medical_registration_number
    ) {

      const registrationExists =
        await doctorRegistrationModel
          .findByRegistrationNumberExceptId(
            medicalRegistrationNumber,
            registrationId,
            connection
          );

      if (registrationExists) {

        await connection.rollback();

        return {
          success: false,
          statusCode: 409,
          message:
            "Medical registration number already exists.",
        };
      }
    }


    await doctorRegistrationModel.updatePartial(
      registrationId,
      {
        fullName,
        gender,
        age,
        email,
        mobile,

        medicalRegistrationNumber:
          medicalRegistrationNumber ||
          null,

        medicalCouncil:
          medicalCouncil ||
          null,

        qualification:
          qualification ||
          null,

        specialization:
          specialization ||
          null,

        registrationExpiryDate:
          registrationExpiryDate ||
          null,
      },
      connection
    );


    const updatedRegistration =
      await doctorRegistrationModel.findById(
        registrationId,
        connection
      );


    if (
      isRegistrationComplete(
        updatedRegistration
      )
    ) {

      await doctorRegistrationModel.submit(
        registrationId,
        connection
      );

      await connection.commit();

      return {
        success: true,
        statusCode: 200,
        message:
          "Doctor registration submitted successfully.",
        data: {
          registrationId,
          onboarding_status:
            "SUBMITTED",
        },
      };
    }


    await connection.commit();


    return {
      success: true,
      statusCode: 200,
      message:
        "Doctor registration draft updated successfully.",
      data: {
        registrationId,
        onboarding_status:
          "DRAFT",
      },
    };


  } catch (error) {

    if (connection) {
      await connection.rollback();
    }

    console.error(
      "CREATE DOCTOR REGISTRATION SERVICE ERROR:",
      error
    );

    throw error;

  } finally {

    if (connection) {
      connection.release();
    }
  }
};

exports.sendEmailOtp = async ({ email }) => {

  const otp =
    Math.floor(
      100000 +
      Math.random() * 900000
    ).toString();

  const expiry =
    new Date(
      Date.now() +
      5 * 60 * 1000
    );

  const exists =
    await doctorRegistrationModel.findByEmail(
      email
    );

  if (!exists) {

    return {
      success: false,
      statusCode: 404,
      message:
        "Email not found.",
    };
  }

  if (
    exists.onboarding_status ===
    "SUBMITTED"
  ) {

    return {
      success: false,
      statusCode: 400,
      message:
        "Doctor registration has already been submitted.",
    };
  }

  if (exists.email_otp_sent_at) {

    const lastOtpTime =
      new Date(
        exists.email_otp_sent_at
      ).getTime();

    const currentTime =
      Date.now();

    const difference =
      currentTime - lastOtpTime;

    const fiveMinutes =
      5 * 60 * 1000;

    if (difference < fiveMinutes) {

      const remainingSeconds =
        Math.ceil(
          (fiveMinutes - difference) / 1000
        );

      return {
        success: false,
        statusCode: 429,
        message:
          `Please wait ${remainingSeconds} seconds before requesting another OTP.`,
      };
    }
  }

  await doctorRegistrationModel.saveEmailOtp(
    email,
    otp,
    expiry
  );

  await sendOtpEmail(
    email,
    otp
  );

  return {
    success: true,
    statusCode: 200,
    message:
      "OTP sent successfully.",
  };
};


exports.verifyEmailOtp = async ({
  email,
  otp,
}) => {

  const user =
    await doctorRegistrationModel.verifyEmailOtp(
      email,
      otp
    );


  if (!user) {

    return {
      success: false,
      statusCode: 400,
      message:
        "Invalid or expired OTP.",
    };
  }


  await doctorRegistrationModel.markEmailVerified(
    email
  );


  await doctorRegistrationModel.clearEmailOtp(
    email
  );

  const registration =
    await doctorRegistrationModel.findByEmail(
      email
    );


  if (!registration) {

    return {
      success: false,
      statusCode: 404,
      message:
        "Doctor registration not found.",
    };
  }

  if (
    isRegistrationComplete(
      registration
    )
  ) {

    await doctorRegistrationModel.submit(
      registration.id
    );


    return {
      success: true,
      statusCode: 200,
      message:
        "Email verified and doctor registration submitted successfully.",
      data: {
        registrationId:
          registration.id,

        onboarding_status:
          "SUBMITTED",
      },
    };
  }


  return {
    success: true,
    statusCode: 200,
    message:
      "Email verified successfully. Please complete the remaining registration details.",
    data: {
      registrationId:
        registration.id,

      onboarding_status:
        "DRAFT",
    },
  };
};


exports.uploadRegistrationDocuments = async ({
  registrationId,
  files,
}) => {

  const uploadedKeys = [];


  try {

    if (!registrationId) {

      return {
        success: false,
        statusCode: 400,
        message:
          "Registration ID is required.",
      };
    }


    const allFiles = [
      ...(files?.medicalRegistrationCertificate || []),
      ...(files?.medicalDegreeCertificate || []),
      ...(files?.governmentIdProof || []),
      ...(files?.selfie || []),
    ];


    if (allFiles.length === 0) {

      return {
        success: false,
        statusCode: 400,
        message:
          "At least one document is required.",
      };
    }

    for (const file of allFiles) {

      const error =
        validateFile(file);

      if (error) {

        return {
          success: false,
          statusCode: 400,
          message: error,
        };
      }
    }


    const registration =
      await doctorRegistrationModel.findById(
        registrationId
      );


    if (!registration) {

      return {
        success: false,
        statusCode: 404,
        message:
          "Doctor registration not found.",
      };
    }


    if (
      registration.onboarding_status !==
      "DRAFT"
    ) {

      return {
        success: false,
        statusCode: 400,
        message:
          "Documents cannot be uploaded after registration submission.",
      };
    }

    const uploadToS3 = async (
      file,
      folder
    ) => {

      const extension =
        path.extname(
          file.originalname
        );

      const fileKey =
        `${folder}/${uuidv4()}${extension}`;


      await s3.send(
        new PutObjectCommand({
          Bucket:
            process.env.AWS_BUCKET_NAME,

          Key:
            fileKey,

          Body:
            file.buffer,

          ContentType:
            file.mimetype,

          ContentDisposition:
            "inline",
        })
      );


      uploadedKeys.push(
        fileKey
      );


      return fileKey;
    };


    const baseUrl =
      `https://${process.env.AWS_BUCKET_NAME}.s3.` +
      `${process.env.AWS_REGION}.amazonaws.com`;


    const data = {};

    if (
      files?.medicalRegistrationCertificate
        ?.length
    ) {

      const key =
        await uploadToS3(
          files.medicalRegistrationCertificate[0],
          "doctor-registration"
        );


      data.medicalRegistrationCertificate = {
        key,
        value:
          `${baseUrl}/${key}`,
      };
    }

    if (
      files?.medicalDegreeCertificate
        ?.length
    ) {

      const key =
        await uploadToS3(
          files.medicalDegreeCertificate[0],
          "doctor-degree"
        );


      data.medicalDegreeCertificate = {
        key,
        value:
          `${baseUrl}/${key}`,
      };
    }

    if (
      files?.governmentIdProof?.length
    ) {

      const key =
        await uploadToS3(
          files.governmentIdProof[0],
          "government-id"
        );


      data.governmentIdProof = {
        key,
        value:
          `${baseUrl}/${key}`,
      };
    }

    if (
      files?.selfie?.length
    ) {

      const key =
        await uploadToS3(
          files.selfie[0],
          "doctor-selfie"
        );


      data.selfie = {
        key,
        value:
          `${baseUrl}/${key}`,
      };
    }


    await doctorRegistrationModel.updateDocuments(
      registrationId,
      {
        medicalRegistrationCertificate:
          data.medicalRegistrationCertificate
            ?.key,

        medicalDegreeCertificate:
          data.medicalDegreeCertificate
            ?.key,

        governmentIdProof:
          data.governmentIdProof
            ?.key,

        selfie:
          data.selfie
            ?.key,
      }
    );

    const updatedRegistration =
      await doctorRegistrationModel.findById(
        registrationId
      );


    if (
      isRegistrationComplete(
        updatedRegistration
      )
    ) {

      await doctorRegistrationModel.submit(
        registrationId
      );


      return {
        success: true,
        statusCode: 200,
        message:
          "Registration documents uploaded and doctor registration submitted successfully.",
        data: {
          ...data,
          registrationId,
          onboarding_status:
            "SUBMITTED",
        },
      };
    }


    return {
      success: true,
      statusCode: 200,
      message:
        "Registration documents uploaded successfully.",
      data: {
        ...data,
        registrationId,
        onboarding_status:
          "DRAFT",
      },
    };


  } catch (error) {

    console.error(
      "UPLOAD REGISTRATION DOCUMENTS SERVICE ERROR:",
      error
    );

    for (
      const key of uploadedKeys
    ) {

      try {

        await s3.send(
          new DeleteObjectCommand({
            Bucket:
              process.env.AWS_BUCKET_NAME,

            Key:
              key,
          })
        );

      } catch (rollbackError) {

        console.error(
          "S3 ROLLBACK ERROR:",
          rollbackError
        );
      }
    }


    return {
      success: false,
      statusCode: 500,
      message:
        "Failed to upload registration documents.",
    };
  }
};


exports.getDoctorRegistrationById = async (id) => {
  try {
    if (!id) {
      return {
        success: false,
        statusCode: 400,
        message: "Registration id is required.",
      };
    }

    const registration =
      await doctorRegistrationModel.findById(id);

    if (!registration) {
      return {
        success: false,
        statusCode: 404,
        message: "Doctor registration not found.",
      };
    }

    return {
      success: true,
      statusCode: 200,
      message: "Doctor registration fetched successfully.",
      data: registration,
    };
  } catch (error) {
    console.error(
      "Get Doctor Registration Service Error:",
      error
    );

    throw error;
  }
};

exports.getAllDoctorRegistrations = async (query) => {
  const {
    page = 1,
    limit = 10,
    search = "",
    status,
  } = query;

  const safePage = Math.max(
    1,
    Number(page) || 1
  );

  const safeLimit = Math.min(
    100,
    Math.max(1, Number(limit) || 10)
  );

  const offset =
    (safePage - 1) * safeLimit;

  const registrations =
    await doctorRegistrationModel.findAll({
      limit: safeLimit,
      offset,
      search,
      status,
    });

  const total =
    await doctorRegistrationModel.countAll(
      search,
      status
    );

  return {
    success: true,
    statusCode: 200,
    message:
      "Doctor registrations fetched successfully.",
    total,
    page: safePage,
    limit: safeLimit,
    totalPages: Math.ceil(
      total / safeLimit
    ),
    data: registrations,
  };
};

exports.updateDoctorRegistration = async (id, body) => {

  const exists =
    await doctorRegistrationModel.findById(id);

  if (!exists) {
    return {
      success: false,
      statusCode: 404,
      message: "Doctor registration not found."
    };
  }

  await doctorRegistrationModel.update(id, body);

  return {
    success: true,
    statusCode: 200,
    message: "Doctor registration updated successfully."
  };
};

exports.submitDoctorRegistration = async (id) => {

  const exists =
    await doctorRegistrationModel.findById(id);

  if (!exists) {
    return {
      success: false,
      statusCode: 404,
      message: "Doctor registration not found."
    };
  }

  await doctorRegistrationModel.submit(id);

  return {
    success: true,
    statusCode: 200,
    message: "Doctor registration submitted successfully."
  };
};

exports.deleteDoctorRegistration = async (id) => {

  const exists =
    await doctorRegistrationModel.findById(id);

  if (!exists) {
    return {
      success: false,
      statusCode: 404,
      message: "Doctor registration not found."
    };
  }

  await doctorRegistrationModel.delete(id);

  return {
    success: true,
    statusCode: 200,
    message: "Doctor registration deleted successfully."
  };
};

exports.getRegistrationDocuments = async (registrationId) => {
  try {
    if (!registrationId) {
      return {
        success: false,
        statusCode: 400,
        message: "Registration id is required.",
      };
    }

    const data =
      await doctorRegistrationModel.findDocumentsById(registrationId);

    if (!data) {
      return {
        success: false,
        statusCode: 404,
        message: "Registration not found.",
      };
    }

    const baseUrl = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com`;

    return {
      success: true,
      statusCode: 200,
      message: "Registration documents fetched successfully.",
      data: {
        id: data.id,
        doctorId: data.doctor_id,
        status: data.status,

        medicalRegistrationCertificate:
          data.medical_registration_certificate
            ? `${baseUrl}/${data.medical_registration_certificate}`
            : null,

        medicalDegreeCertificate:
          data.medical_degree_certificate
            ? `${baseUrl}/${data.medical_degree_certificate}`
            : null,

        governmentIdProof:
          data.government_id_proof
            ? `${baseUrl}/${data.government_id_proof}`
            : null,

        selfie:
          data.selfie
            ? `${baseUrl}/${data.selfie}`
            : null,

        createdAt: data.created_at,
        updatedAt: data.updated_at,
      },
    };
  } catch (error) {
    console.error(
      "Get Registration Documents Service Error:",
      error
    );

    return {
      success: false,
      statusCode: 500,
      message: "Failed to fetch registration documents.",
    };
  }
};

exports.getDoctorRegistrations = async (query) => {
  try {
    const {
      filter,
      date,
      onboarding_status,
      page,
      limit,
    } = query;

    const result =
      await doctorRegistrationModel.getDoctorRegistrations({
        filter,
        date,
        onboarding_status,
        page,
        limit,
      });

    return {
      success: true,
      statusCode: 200,
      message: "Doctor registrations fetched successfully.",
      data: result.rows,
      pagination: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages,
      },
    };

  } catch (error) {
    console.error(
      "GET DOCTOR REGISTRATIONS SERVICE ERROR:",
      error
    );

    return {
      success: false,
      statusCode: 500,
      message: "Internal Server Error.",
    };
  }
};

exports.getRegistrationStats = async () => {
  try {
    const stats =
      await doctorRegistrationModel.getRegistrationStats();

    return stats;
  } catch (error) {
    console.error(
      "Get Doctor Registration Stats Service Error:",
      error
    );

    throw error;
  }
};