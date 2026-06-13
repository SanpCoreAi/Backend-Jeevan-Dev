const Joi = require("joi");

const bookAppointmentSchema = Joi.object({
  appointment_date: Joi.string().required(),
  start_time: Joi.string().required(),
  end_time: Joi.string().required(),
  reason_for_visit: Joi.string().required(),
  booking_type: Joi.string().required(),
  mode: Joi.string().valid("online", "offline").required(),
  hospital_name: Joi.string().required(),

  patient: Joi.object({
    name: Joi.string().required(),
    age: Joi.number().required(),
    gender: Joi.string().required(),
    phone: Joi.string().required(),
    email: Joi.string().email().required()
  }).when("booking_type", {
    is: "someone_else",
    then: Joi.required(),
    otherwise: Joi.optional()
  })
});

module.exports = { bookAppointmentSchema };