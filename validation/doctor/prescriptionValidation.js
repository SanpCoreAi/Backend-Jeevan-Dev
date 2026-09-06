const Joi = require("joi");

const savePrescriptionValidation = Joi.object({
  appointmentId: Joi.number()
    .integer()
    .positive()
    .optional(),

  appointment_id: Joi.number()
    .integer()
    .positive()
    .optional(),

  medicines: Joi.array()
    .items(
      Joi.object({
        medicine_name: Joi.string()
          .trim()
          .min(1)
          .max(255)
          .required(),

        dose: Joi.string()
          .trim()
          .max(100)
          .allow("", null)
          .optional(),

        frequency: Joi.string()
          .trim()
          .max(100)
          .allow("", null)
          .optional(),

        duration: Joi.string()
          .trim()
          .max(100)
          .allow("", null)
          .optional(),

        instructions: Joi.string()
          .trim()
          .max(500)
          .allow("", null)
          .optional()
      })
    )
    .min(1)
    .required(),

  remark: Joi.string()
    .trim()
    .max(1000)
    .allow("", null)
    .optional(),

  follow_up_date: Joi.date()
    .iso()
    .allow("", null)
    .optional(),

  diagnosis: Joi.string()
    .trim()
    .max(1000)
    .allow("", null)
    .optional()
})
  .or("appointmentId", "appointment_id")
  .messages({
    "object.missing": "Appointment ID is required."
  });

const updatePrescriptionValidation = Joi.object({
  medicines: Joi.array()
    .items(
      Joi.object({
        medicine_name: Joi.string().trim().min(1).max(255).required(),
        dose: Joi.string().trim().max(100).allow("", null).optional(),
        frequency: Joi.string().trim().max(100).allow("", null).optional(),
        duration: Joi.string().trim().max(100).allow("", null).optional(),
        instructions: Joi.string().trim().max(500).allow("", null).optional()
      })
    )
    .min(1)
    .required(),

  remark: Joi.string()
    .trim()
    .max(1000)
    .allow("", null)
    .optional(),

  follow_up_date: Joi.date()
    .iso()
    .allow("", null)
    .optional(),

  diagnosis: Joi.string()
    .trim()
    .max(1000)
    .allow("", null)
    .optional()
});

module.exports = {savePrescriptionValidation, updatePrescriptionValidation};