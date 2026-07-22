const Joi = require("joi");

exports.createNotificationSchema = Joi.object({

    userId: Joi.number()
        .integer()
        .required(),

    title: Joi.string()
        .trim()
        .min(3)
        .max(255)
        .required(),

    message: Joi.string()
        .trim()
        .min(5)
        .max(1000)
        .required(),

    type: Joi.string()
        .valid(
            "INFO",
            "SUCCESS",
            "WARNING",
            "ERROR"
        )
        .optional()

});

exports.updateNotificationSchema = Joi.object({

    title: Joi.string()
        .trim()
        .min(3)
        .max(255),

    message: Joi.string()
        .trim()
        .min(5)
        .max(1000),

    type: Joi.string()
        .valid(
            "INFO",
            "SUCCESS",
            "WARNING",
            "ERROR"
        ),

    is_read: Joi.boolean()

}).min(1);