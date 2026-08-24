const Joi = require("joi");


exports.verifyTokenValidation = Joi.object({
  appointmentId: Joi.number()
    .integer()
    .positive()
    .required()
});


exports.appointmentIdValidation = Joi.object({
  id: Joi.number()
    .integer()
    .positive()
    .required()
});


exports.completeByTokenValidation = Joi.object({
  token: Joi.number()
    .integer()
    .positive()
    .required()
});


exports.revisitValidation = Joi.object({
  patientId: Joi.number()
    .integer()
    .positive()
    .required(),

  doctorId: Joi.number()
    .integer()
    .positive()
    .required()
});

exports.getPrescriptionValidation = Joi.object({
  appointment_id: Joi.number()
    .integer()
    .positive()
    .required()
});

exports.editPrescriptionValidation = Joi.object({
  medicines: Joi.array()
    .min(1)
    .items(
      Joi.object({
        medicine_name: Joi.string()
          .trim()
          .required(),

        dose: Joi.string()
          .trim()
          .required(),

        frequency: Joi.string()
          .trim()
          .required(),

        duration: Joi.string()
          .trim()
          .required(),

        instructions: Joi.string()
          .allow("")
          .optional()
      })
    )
    .required()
});