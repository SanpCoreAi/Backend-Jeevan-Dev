const Joi = require("joi");

exports.refreshTokenValidation = (data) => {

  const schema = Joi.object({

    refreshToken: Joi.string()
      .trim()
      .required()
      .messages({

        "string.base": "Refresh token must be a string",

        "string.empty": "Refresh token is required",

        "any.required": "Refresh token is required"

      })

  }).options({

    abortEarly: true,

    allowUnknown: false,

    stripUnknown: true

  });

  const { error } = schema.validate(data);

  return error
    ? error.details[0].message
    : null;

};