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

exports.createDoctorRegistration = async (body) => {

  let connection;

  try {

    connection = await db.getConnection();

    await connection.beginTransaction();

    const {
      fullName,
      gender,
      age,
      email,
      mobile,
      medicalRegistrationNumber,
      medicalCouncil,
      qualification,
      specialization,
      registrationExpiryDate
    } = body;

    // Check Email
    const emailExists = await doctorRegistrationModel.findByEmail(email, connection);

    if (emailExists) {

      await connection.rollback();

      return {
        success: false,
        statusCode: 409,
        message: "Email already exists."
      };
    }

    // Check Mobile
    const mobileExists = await doctorRegistrationModel.findByMobile(mobile, connection);

    if (mobileExists) {

      await connection.rollback();

      return {
        success: false,
        statusCode: 409,
        message: "Mobile number already exists."
      };
    }

    // Check Medical Registration Number
    const registrationExists = await doctorRegistrationModel.findByRegistrationNumber(
      medicalRegistrationNumber,
      connection
    );

    if (registrationExists) {

      await connection.rollback();

      return {
        success: false,
        statusCode: 409,
        message: "Medical registration number already exists."
      };
    }

    const registrationId = await doctorRegistrationModel.create(
      {
        fullName,
        gender,
        age,
        email,
        mobile,
        medicalRegistrationNumber,
        medicalCouncil,
        qualification,
        specialization,
        registrationExpiryDate
      },
      connection
    );

    await connection.commit();

    return {
      success: true,
      statusCode: 201,
      message: "Doctor registration created successfully.",
      data: {
        registrationId
      }
    };

  } catch (error) {

    if (connection) {
      await connection.rollback();
    }

    throw error;

  } finally {

    if (connection) {
      connection.release();
    }

  }

};

exports.getDoctorRegistrationById = async (id) => {

  const registration = await doctorRegistrationModel.findById(id);

  if (!registration) {
    return {
      success: false,
      statusCode: 404,
      message: "Doctor registration not found."
    };
  }

  return {
    success: true,
    statusCode: 200,
    message: "Doctor registration fetched successfully.",
    data: registration
  };
};

exports.getAllDoctorRegistrations = async (query) => {

  const {
    page,
    limit,
    search,
    status
  } = query;

  const offset = (page - 1) * limit;

  const registrations =
    await doctorRegistrationModel.findAll(
      {
        limit,
        offset,
        search,
        status
      }
    );

  const total =
    await doctorRegistrationModel.countAll(search, status);

  return {
    success: true,
    statusCode: 200,
    message: "Doctor registrations fetched successfully.",
    total,
    page,
    limit,
    data: registrations
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

exports.sendEmailOtp = async ({ email }) => {

  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  const expiry = new Date(Date.now() + 10 * 60 * 1000);

  const exists = await doctorRegistrationModel.findByEmail(email);

  if (!exists) {

    return {
      success: false,
      statusCode: 404,
      message: "Email not found."
    };

  }

  await doctorRegistrationModel.saveEmailOtp(
    email,
    otp,
    expiry
  );

  await sendOtpEmail(email, otp);

  return {
    success: true,
    statusCode: 200,
    message: "OTP sent successfully."
  };

};

exports.verifyEmailOtp = async ({ email, otp }) => {

  const user = await doctorRegistrationModel.verifyEmailOtp(
    email,
    otp
  );

  if (!user) {

    return {
      success: false,
      statusCode: 400,
      message: "Invalid or expired OTP."
    };

  }

  await doctorRegistrationModel.markEmailVerified(email);

  return {
    success: true,
    statusCode: 200,
    message: "Email verified successfully."
  };

};

exports.uploadRegistrationDocuments = async ({ registrationId, files }) => {
  if (!registrationId) {
    return {
      success: false,
      statusCode: 400,
      message: "Registration id is required.",
    };
  }

  const uploadedKeys = [];

  try {

    const allFiles = [
      ...(files.medicalRegistrationCertificate || []),
      ...(files.medicalDegreeCertificate || []),
      ...(files.governmentIdProof || []),
      ...(files.selfie || []),
    ];

    if (allFiles.length === 0) {
      return {
        success: false,
        statusCode: 400,
        message: "At least one document is required.",
      };
    }

    for (const file of allFiles) {
      const error = validateFile(file);

      if (error) {
        return {
          success: false,
          statusCode: 400,
          message: error,
        };
      }
    }

    const uploadToS3 = async (file, folder) => {

      const extension = path.extname(file.originalname);

      const fileKey = `${folder}/${uuidv4()}${extension}`;

      await s3.send(
        new PutObjectCommand({
          Bucket: process.env.AWS_BUCKET_NAME,
          Key: fileKey,
          Body: file.buffer,
          ContentType: file.mimetype,
          ContentDisposition: "inline",
        })
      );

      uploadedKeys.push(fileKey);

      return fileKey;
    };

    const payload = {
      id: registrationId,
    };

    if (files.medicalRegistrationCertificate?.length) {
      payload.medical_registration_certificate = await uploadToS3(
        files.medicalRegistrationCertificate[0],
        "doctor-registration"
      );
    }

    if (files.medicalDegreeCertificate?.length) {
      payload.medical_degree_certificate = await uploadToS3(
        files.medicalDegreeCertificate[0],
        "doctor-degree"
      );
    }

    if (files.governmentIdProof?.length) {
      payload.government_id_proof = await uploadToS3(
        files.governmentIdProof[0],
        "government-id"
      );
    }

    if (files.selfie?.length) {
      payload.selfie = await uploadToS3(
        files.selfie[0],
        "doctor-selfie"
      );
    }

    const savedData =
      await doctorRegistrationModel.updateDocuments(payload);

    if (!savedData || savedData.affectedRows === 0) {
      return {
        success: false,
        statusCode: 404,
        message: "Registration not found or documents were not saved.",
      };
    }

    const baseUrl = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com`;

    return {
      success: true,
      statusCode: 200,
      message: "Registration documents uploaded successfully.",
      data: {
        id: savedData.id || payload.id || null,

        medicalRegistrationCertificate:
          payload.medical_registration_certificate
            ? `${baseUrl}/${payload.medical_registration_certificate}`
            : null,

        medicalDegreeCertificate:
          payload.medical_degree_certificate
            ? `${baseUrl}/${payload.medical_degree_certificate}`
            : null,

        governmentIdProof:
          payload.government_id_proof
            ? `${baseUrl}/${payload.government_id_proof}`
            : null,

        selfie:
          payload.selfie
            ? `${baseUrl}/${payload.selfie}`
            : null,
      },
    };

  } catch (error) {

    console.error(
      "Upload Registration Documents Service Error:",
      error
    );

    for (const key of uploadedKeys) {
      try {
        await s3.send(
          new DeleteObjectCommand({
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: key,
          })
        );
      } catch (rollbackError) {
        console.error("S3 Rollback Error:", rollbackError);
      }
    }

    return {
      success: false,
      statusCode: 500,
      message: "Failed to upload registration documents.",
    };
  }
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