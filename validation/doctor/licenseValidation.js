const Joi = require("joi");

const licenseValidationSchema = Joi.object({
  doctorId: Joi.number().integer().positive().required()
    .messages({ "any.required": "Doctor ID is required" }),
  licenseFile: Joi.string().required()
    .messages({ "any.required": "License file name is required" })
});

module.exports = licenseValidationSchema;
