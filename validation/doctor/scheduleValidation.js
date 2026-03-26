const Joi = require('joi');

const scheduleSchema = Joi.object({
  location: Joi.string().required().trim().min(1).max(100),
  startTime: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).required(),
  endTime: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).required(),
  slotDuration: Joi.number().integer().min(1).max(480).required(),
  skipMinutes: Joi.number().integer().min(0).max(60).default(0),
  days: Joi.array().items(Joi.number().integer().min(0).max(6)).min(1).max(7).required(),
  startDate: Joi.date().allow(null).default(null),
  endDate: Joi.date().allow(null).default(null),
  note: Joi.string().allow('').max(500).default(''),
  isActive: Joi.boolean().default(true),
});

module.exports = scheduleSchema;