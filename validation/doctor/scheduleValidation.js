const Joi = require("joi");

const createScheduleValidation = Joi.object({

  location_id: Joi.number()
    .integer()
    .positive()
    .allow(null),

  hospital_name: Joi.string()
    .trim()
    .min(2)
    .max(255)
    .required(),

  start_time: Joi.string()
    .trim()
    .required(),

  end_time: Joi.string()
    .trim()
    .required(),

  slot_duration: Joi.number()
    .integer()
    .min(1)
    .max(240)
    .required(),

  break_minutes: Joi.number()
    .integer()
    .min(0)
    .max(120)
    .default(0),

  active_days: Joi.array()
    .items(
      Joi.string().valid(
        "Sun",
        "Mon",
        "Tue",
        "Wed",
        "Thu",
        "Fri",
        "Sat"
      )
    )
    .min(1)
    .required(),

  start_date: Joi.date()
    .required(),

  end_date: Joi.date()
    .min(Joi.ref("start_date"))
    .required(),

  note: Joi.string()
    .trim()
    .max(500)
    .allow("", null),

  offlinepatient_number: Joi.number()
    .integer()
    .min(1)
    .allow(null)

});

const updateScheduleValidation = Joi.object({

  location_id: Joi.number()
    .integer()
    .positive()
    .allow(null),

  hospital_name: Joi.string()
    .trim()
    .min(2)
    .max(255),

  start_time: Joi.string(),

  end_time: Joi.string(),

  slot_duration: Joi.number()
    .integer()
    .min(1)
    .max(240),

  break_minutes: Joi.number()
    .integer()
    .min(0)
    .max(120),

  active_days: Joi.array().items(
    Joi.string().valid(
      "Sun",
      "Mon",
      "Tue",
      "Wed",
      "Thu",
      "Fri",
      "Sat"
    )
  ),

  start_date: Joi.date(),

  end_date: Joi.date(),

  note: Joi.string()
    .trim()
    .max(500)
    .allow("", null),

  offlinepatient_number: Joi.number()
    .integer()
    .min(1)
    .allow(null)

}).min(1);

const deleteScheduleValidation = Joi.object({

  date: Joi.date()
    .optional()
    .messages({
      "date.base": "Date must be a valid date."
    }),

  slotId: Joi.number()
    .integer()
    .positive()
    .optional()
    .messages({
      "number.base": "Slot ID must be a number.",
      "number.integer": "Slot ID must be an integer.",
      "number.positive": "Slot ID must be positive."
    }),

  reason: Joi.string()
    .trim()
    .min(5)
    .max(255)
    .required()
    .messages({
      "string.empty": "Reason is required.",
      "string.min": "Reason must be at least 5 characters.",
      "string.max": "Reason cannot exceed 255 characters.",
      "any.required": "Reason is required."
    })

}).or("date", "slotId");

module.exports = {
  createScheduleValidation,
  updateScheduleValidation,
  deleteScheduleValidation
};