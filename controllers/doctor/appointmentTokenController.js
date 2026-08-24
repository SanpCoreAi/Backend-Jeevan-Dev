const appointmentTokenService = require("../../services/doctor/appointmentTokenService");

const {
  verifyTokenValidation,
  appointmentIdValidation,
  completeByTokenValidation,
  revisitValidation,
  getPrescriptionValidation,
  editPrescriptionValidation
} = require("../../validation/doctor/appointmentTokenValidation");

exports.verifyToken = async (req, res) => {
  try {
    const { error, value } =
      verifyTokenValidation.validate(req.params);

    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message
      });
    }

    const doctorId = Number(req.user?.id);

    if (!Number.isInteger(doctorId) || doctorId <= 0) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized doctor."
      });
    }

    const result =
      await appointmentTokenService.verifyToken({
        doctorId,
        appointmentId: value.appointmentId
      });

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.message
      });
    }

    return res.status(200).json({
      success: true,
      message: result.message,
      data: result.data
    });

  } catch (error) {
    console.error("VERIFY APPOINTMENT ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error."
    });
  }
};

exports.start = async (req, res) => {
  try {

    const { error, value } =
      appointmentIdValidation.validate(req.params);

    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message
      });
    }

    const result =
      await appointmentTokenService.start(
        value.id
      );

    return res.status(200).json({
      success: true,
      message: result.message
    });

  } catch (error) {

    console.error(
      "START APPOINTMENT ERROR:",
      error
    );

    return res.status(400).json({
      success: false,
      message: error.message
    });

  }
};

exports.getDetails = async (req, res) => {
  try {

    const { error, value } =
      appointmentIdValidation.validate(req.params);

    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message
      });
    }

    const data =
      await appointmentTokenService.getDetails(
        value.id
      );

    return res.status(200).json({
      success: true,
      message:
        "Appointment details fetched successfully.",
      data
    });

  } catch (error) {

    console.error(
      "GET APPOINTMENT DETAILS ERROR:",
      error
    );

    return res.status(400).json({
      success: false,
      message: error.message
    });

  }
};

exports.complete = async (req, res) => {
  try {

    const { error, value } =
      appointmentIdValidation.validate(req.params);

    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message
      });
    }

    const result =
      await appointmentTokenService.complete(
        value.id
      );

    return res.status(200).json({
      success: true,
      message: result.message
    });

  } catch (error) {

    console.error(
      "COMPLETE APPOINTMENT ERROR:",
      error
    );

    return res.status(400).json({
      success: false,
      message: error.message
    });

  }
};


exports.completeByToken = async (req, res) => {
  try {

    const { error, value } =
      completeByTokenValidation.validate(req.params);

    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message
      });
    }

    const result =
      await appointmentTokenService.completeByToken(
        value.token
      );

    return res.status(200).json({
      success: true,
      message: result.message
    });

  } catch (error) {

    console.error(
      "COMPLETE APPOINTMENT BY TOKEN ERROR:",
      error
    );

    return res.status(400).json({
      success: false,
      message: error.message
    });

  }
};

exports.editPrescription = async (req, res) => {
  try {

    const {
      error: paramsError,
      value: paramsValue
    } = appointmentIdValidation.validate(req.params);

    if (paramsError) {
      return res.status(400).json({
        success: false,
        message: paramsError.details[0].message
      });
    }

    const {
      error: bodyError,
      value: bodyValue
    } = editPrescriptionValidation.validate(req.body);

    if (bodyError) {
      return res.status(400).json({
        success: false,
        message: bodyError.details[0].message
      });
    }

    const result =
      await appointmentTokenService.editPrescription(
        paramsValue.id,
        bodyValue.medicines
      );

    return res.status(200).json({
      success: true,
      message: result.message
    });

  } catch (error) {

    console.error(
      "EDIT PRESCRIPTION ERROR:",
      error
    );

    return res.status(400).json({
      success: false,
      message: error.message
    });

  }
};

exports.revisit = async (req, res) => {
  try {

    const { error, value } =
      revisitValidation.validate(req.params);

    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message
      });
    }

    const data =
      await appointmentTokenService.revisit(
        value.patientId,
        value.doctorId
      );

    return res.status(200).json({
      success: true,
      message: "Last appointment fetched successfully.",
      data
    });

  } catch (error) {

    console.error(
      "REVISIT PATIENT ERROR:",
      error
    );

    return res.status(400).json({
      success: false,
      message: error.message
    });

  }
};

exports.getPrescription = async (req, res) => {
  try {

    const { error, value } =
      getPrescriptionValidation.validate(req.query);

    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message
      });
    }

    const data =
      await appointmentTokenService.getFullPrescription(
        value.appointment_id
      );

    return res.status(200).json({
      success: true,
      message: "Prescription fetched successfully.",
      data
    });

  } catch (error) {

    console.error(
      "GET PRESCRIPTION ERROR:",
      error
    );

    return res.status(400).json({
      success: false,
      message: error.message
    });

  }
};