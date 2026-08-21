const doctorRegistrationService = require("../../services/doctorVerification/doctorRegistrationService");
const { upload } = require("../../middlewares/multer");
const {
  createDoctorRegistrationValidation,
} = require("../../validation/doctorVerification/doctorRegistrationValidation");


exports.createDoctorRegistration = async (req, res) => {
  try {
    const { error, value } =
      createDoctorRegistrationValidation.validate(
        req.body,
        {
          abortEarly: true,
          stripUnknown: true,
        }
      );

    if (error) {
      return res.status(400).json({
        success: false,
        statusCode: 400,
        message: error.details[0].message,
      });
    }

    const result =
      await doctorRegistrationService.createDoctorRegistration(
        value
      );

    return res
      .status(result.statusCode)
      .json(result);

  } catch (error) {
    console.error(
      "CREATE DOCTOR REGISTRATION ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      statusCode: 500,
      message: "Internal server error.",
    });
  }
};


exports.uploadRegistrationDocuments = (req, res) => {
  upload.fields([
    {
      name: "medicalRegistrationCertificate",
      maxCount: 1,
    },
    {
      name: "medicalDegreeCertificate",
      maxCount: 1,
    },
    {
      name: "governmentIdProof",
      maxCount: 1,
    },
    {
      name: "selfie",
      maxCount: 1,
    },
  ])(req, res, async (err) => {
    try {

      if (err) {
        return res.status(400).json({
          success: false,
          statusCode: 400,
          message: err.message,
        });
      }

      const registrationId =
        req.body.registrationId;

      if (!registrationId) {
        return res.status(400).json({
          success: false,
          statusCode: 400,
          message: "Registration ID is required.",
        });
      }

      const files = req.files || {};

      const result =
        await doctorRegistrationService.uploadRegistrationDocuments({
          registrationId,
          files,
        });

      return res
        .status(result.statusCode)
        .json({
          success: result.success,
          statusCode: result.statusCode,
          message: result.message,
          data: result.data || null,
        });

    } catch (error) {

      console.error(
        "UPLOAD REGISTRATION DOCUMENTS CONTROLLER ERROR:",
        error
      );

      return res.status(500).json({
        success: false,
        statusCode: 500,
        message: "Internal Server Error.",
      });
    }
  });
};


exports.sendEmailOtp = async (req, res) => {
  try {

    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        statusCode: 400,
        message: "Email is required.",
      });
    }

    const result =
      await doctorRegistrationService.sendEmailOtp({
        email,
      });

    return res
      .status(result.statusCode)
      .json(result);

  } catch (error) {

    console.error(
      "SEND EMAIL OTP CONTROLLER ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      statusCode: 500,
      message: "Internal server error.",
    });
  }
};


exports.verifyEmailOtp = async (req, res) => {
  try {

    const {
      email,
      otp,
    } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        statusCode: 400,
        message: "Email and OTP are required.",
      });
    }

    const result =
      await doctorRegistrationService.verifyEmailOtp({
        email,
        otp,
      });

    return res
      .status(result.statusCode)
      .json(result);

  } catch (error) {

    console.error(
      "VERIFY EMAIL OTP CONTROLLER ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      statusCode: 500,
      message: "Internal server error.",
    });
  }
};

exports.getDoctorRegistrationById = async (req, res) => {
  try {
    const { id } = req.params;

    const result =
      await doctorRegistrationService.getDoctorRegistrationById(id);

    return res
      .status(result.statusCode)
      .json(result);

  } catch (error) {
    console.error(
      "GET DOCTOR REGISTRATION ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      statusCode: 500,
      message: "Internal server error.",
    });
  }
};

exports.getAllDoctorRegistrations = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = "",
      status,
    } = req.query;

    const pageNumber = Math.max(Number(page) || 1, 1);
    const limitNumber = Math.min(
      Math.max(Number(limit) || 10, 1),
      100
    );

    const result =
      await doctorRegistrationService.getAllDoctorRegistrations({
        page: pageNumber,
        limit: limitNumber,
        search: search.trim(),
        status,
      });

    return res
      .status(result.statusCode)
      .json(result);

  } catch (error) {
    console.error(
      "GET ALL DOCTOR REGISTRATIONS ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      statusCode: 500,
      message: "Internal server error.",
    });
  }
};

exports.updateDoctorRegistration = async (req, res) => {
    try {
        const { id } = req.params;

        const result = await doctorRegistrationService.updateDoctorRegistration(
            id,
            req.body
        );

        return res.status(result.statusCode).json(result);

    } catch (error) {
        console.error("UPDATE DOCTOR REGISTRATION ERROR:", error);

        return res.status(500).json({
            success: false,
            statusCode: 500,
            message: "Internal server error."
        });
    }
};

exports.submitDoctorRegistration = async (req, res) => {
    try {
        const { id } = req.params;

        const result = await doctorRegistrationService.submitDoctorRegistration(id);

        return res.status(result.statusCode).json(result);

    } catch (error) {
        console.error("SUBMIT DOCTOR REGISTRATION ERROR:", error);

        return res.status(500).json({
            success: false,
            statusCode: 500,
            message: "Internal server error."
        });
    }
};

exports.deleteDoctorRegistration = async (req, res) => {
    try {
        const { id } = req.params;

        const result = await doctorRegistrationService.deleteDoctorRegistration(id);

        return res.status(result.statusCode).json(result);

    } catch (error) {
        console.error("DELETE DOCTOR REGISTRATION ERROR:", error);

        return res.status(500).json({
            success: false,
            statusCode: 500,
            message: "Internal server error."
        });
    }
};


exports.getRegistrationDocuments = async (req, res) => {
  try {
    const registrationId = req.params.id;

    const result =
      await doctorRegistrationService.getRegistrationDocuments(
        registrationId
      );

    return res.status(result.statusCode).json({
      success: result.success,
      message: result.message,
      data: result.data || null,
    });
  } catch (error) {
    console.error(
      "Get Registration Documents Controller Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Internal Server Error.",
    });
  }
};