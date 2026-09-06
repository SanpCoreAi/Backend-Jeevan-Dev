const service = require("../../services/doctor/prescriptionService");
const {savePrescriptionValidation,updatePrescriptionValidation} = require("../../validation/doctor/prescriptionValidation");

exports.save = async (req, res, next) => {
  try {
    const { error, value } =
      savePrescriptionValidation.validate(req.body, {
        abortEarly: false,
        stripUnknown: true
      });

    if (error) {
      return res.status(400).json({
        success: false,
        message: "Validation failed.",
        errors: error.details.map((err) => err.message),
        data: null
      });
    }

    const appointmentId =
      value.appointmentId ||
      value.appointment_id;

    const result = await service.save({
      appointmentId,
      medicines: value.medicines,
      remark: value.remark ?? null,
      followUpDate: value.follow_up_date ?? null,
      diagnosis: value.diagnosis ?? null
    });

    return res.status(result.statusCode).json({
      success: result.success,
      message: result.message,
      data: result.data
    });

  } catch (error) {
    console.error(
      "SAVE PRESCRIPTION CONTROLLER ERROR:",
      error
    );

    next(error);
  }
};

exports.update = async (req, res, next) => {
  try {
    const appointmentId = req.params.appointmentId;

    if (!appointmentId) {
      return res.status(400).json({
        success: false,
        message: "Appointment ID is required.",
        data: null
      });
    }

    const { error, value } = updatePrescriptionValidation.validate(
      req.body,
      {
        abortEarly: false,
        stripUnknown: true
      }
    );

    if (error) {
      return res.status(400).json({
        success: false,
        message: "Validation failed.",
        errors: error.details.map((err) => err.message),
        data: null
      });
    }

    const result = await service.update(
      appointmentId,
      value.medicines,
      value.remark ?? null,
      value.follow_up_date ?? null,
      value.diagnosis ?? null
    );

    return res.status(result.statusCode).json({
      success: result.success,
      message: result.message,
      data: result.data
    });
  } catch (error) {
    console.error("UPDATE PRESCRIPTION CONTROLLER ERROR:", error);
    next(error);
  }
};