const Joi = require("joi");

exports.bookAppointmentValidation = Joi.object({

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
    .trim()
    .allow("", null),

  booking_type: Joi.string()
    .valid("myself","someone_else")
    .required(),

  mode: Joi.string()
    .valid("online", "offline")
    .required(),

  hospital_name: Joi.when("mode", {
    is: "offline",
    then: Joi.string().trim().required(),
    otherwise: Joi.string().allow("", null)
  }),

  patient: Joi.when("booking_type", {

    is: "someone_else",

    then: Joi.object({

      name: Joi.string()
        .trim()
        .required(),

      age: Joi.number()
        .integer()
        .min(0)
        .max(120)
        .required(),

      gender: Joi.string()
        .valid(
          "Male",
          "Female",
          "Other"
        )
        .required(),

      phone: Joi.string()
        .pattern(/^[6-9]\d{9}$/)
        .required(),

      email: Joi.string()
        .email()
        .required()

    }).required(),

    otherwise: Joi.forbidden()

  })

});

exports.bookAppointmentByAssistantValidation = Joi.object({
  appointment_date: Joi.string()
    .pattern(/^\d{4}-\d{2}-\d{2}$/)
    .required(),

  hospital_name: Joi.string()
    .trim()
    .required(),

  mode: Joi.string()
    .valid("offline")
    .required(),

  booking_type: Joi.string()
    .valid("someone_else")
    .required(),

  time: Joi.string()
    .pattern(
      /^(?:[01]\d|2[0-3]):[0-5]\d\s+to\s+(?:[01]\d|2[0-3]):[0-5]\d$/
    )
    .required()
    .messages({
      "string.pattern.base":
        'Time must be in format "10:00 to 10:05".',
      "any.required":
        "Appointment time is required."
    }),

  token: Joi.number()
    .integer()
    .positive()
    .required()
    .messages({
      "number.base": "Token must be a number.",
      "number.integer": "Token must be an integer.",
      "number.positive": "Token must be greater than 0.",
      "any.required": "Token is required."
    }),

  reason_for_visit: Joi.string()
    .trim()
    .max(500)
    .allow("", null),

  patient: Joi.object({
    name: Joi.string()
      .trim()
      .required(),

    age: Joi.number()
      .integer()
      .min(0)
      .max(150)
      .required(),

    gender: Joi.string()
      .valid("Male", "Female", "Other")
      .required(),

    phone: Joi.string()
      .pattern(/^[6-9]\d{9}$/)
      .required(),

    email: Joi.string()
      .email()
      .required()
  }).required()

}).unknown(false);


exports.cancelAppointmentValidation =
Joi.object({

  reason: Joi.string()
    .trim()
    .min(5)
    .max(255)
    .required()

});


exports.appointmentIdValidation =
Joi.object({

  appointmentId: Joi.number()
    .integer()
    .positive()
    .required()

});


exports.getDoctorSlotsValidation =
Joi.object({

  doctorId: Joi.number()
    .integer()
    .positive()
    .required(),

  hospitalName: Joi.string()
    .trim()
    .required(),

  date: Joi.date()
    .required()

});


exports.getDoctorAppointmentsValidation =
Joi.object({

  hospitalName: Joi.string()
    .trim()
    .required(),

  mode: Joi.string()
    .valid("online", "offline")
    .optional(),

  slot_date: Joi.date()
    .optional(),

  status: Joi.string()
    .valid(
      "PENDING",
      "IN_PROGRESS",
      "COMPLETED",
      "CANCELLED"
    )
    .optional(),

  page: Joi.number()
    .integer()
    .min(1)
    .default(1),

  limit: Joi.number()
    .integer()
    .min(1)
    .max(100)
    .default(10)

});

