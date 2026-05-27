const Joi = require("joi");

const bookAppointmentSchema = Joi.object({
  appointment_date: Joi.string().required(),
  start_time: Joi.string().required(),
  end_time: Joi.string().required(),
  reason_for_visit: Joi.string().required(),
  booking_type: Joi.string().required(),
  mode: Joi.string().valid("online", "offline").required(),
  hospital_name: Joi.string().required() // ✅ important
});

module.exports = { bookAppointmentSchema };