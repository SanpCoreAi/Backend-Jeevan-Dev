const Joi = require("joi");

const bookAppointmentSchema = Joi.object({

  appointment_date: Joi.date()
    .required()
    .messages({
      "any.required": "Appointment date is required"
    }),

  start_time: Joi.string()
    .required()
    .messages({
      "any.required": "Start time is required"
    }),

  end_time: Joi.string()
    .required()
    .messages({
      "any.required": "End time is required"
    }),

  reason_for_visit: Joi.string()
    .min(3)
    .max(500)
    .required(),

  booking_type: Joi.string()
    .valid("myself", "someone_else")
    .required(),

  mode: Joi.string()
    .valid("online", "offline")
    .required(),

  patient: Joi.object({
    name: Joi.string().min(2).max(100).required(),
    age: Joi.number().min(0).max(120).required(),
    gender: Joi.string().valid("male", "female", "other").required(),
    phone: Joi.string().min(10).max(15).required(),
    email: Joi.string().email().required()
  }).when("booking_type", {
    is: "someone_else",
    then: Joi.required(),
    otherwise: Joi.optional()
  })

});

module.exports = {
  bookAppointmentSchema
};