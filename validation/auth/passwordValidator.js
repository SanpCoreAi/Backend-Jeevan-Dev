const Joi=require("joi");


exports.forgotPasswordValidation = (data) => {

  const schema = Joi.object({

    email: Joi.string()
      .trim()
      .lowercase()
      .email()
      .max(255)
      .required()

  }).options({

    abortEarly: true,

    allowUnknown: false,

    stripUnknown: true,

  });

  const { error } =
    schema.validate(data);

  return error
    ? error.details[0].message
    : null;

};

exports.resetPasswordValidation = (data) => {

  const schema = Joi.object({

    token: Joi.string()
      .trim()
      .required()
      .messages({

        "string.empty":"Token is required",

        "any.required":"Token is required"

      }),

    password: Joi.string()
      .trim()
      .min(8)
      .max(100)
      .pattern(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).+$/
      )
      .required()
      .messages({

        "string.empty":
        "Password is required",

        "string.min":
        "Password must be at least 8 characters",

        "string.max":
        "Password must not exceed 100 characters",

        "string.pattern.base":
        "Password must contain uppercase, lowercase, number and special character",

        "any.required":
        "Password is required"

      })

  }).options({

    abortEarly:true,

    allowUnknown:false,

    stripUnknown:true

  });

  const { error } =
    schema.validate(data);

  return error
    ? error.details[0].message
    : null;

};

exports.changePasswordValidation = (data) => {

  const schema = Joi.object({

    oldPassword: Joi.string()
      .trim()
      .min(8)
      .max(100)
      .required()
      .messages({
        "string.empty": "Old password is required",
        "string.min": "Old password must be at least 8 characters",
        "string.max": "Old password must not exceed 100 characters",
        "any.required": "Old password is required",
      }),

    newPassword: Joi.string()
      .trim()
      .min(8)
      .max(100)
      .pattern(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).+$/
      )
      .required()
      .messages({
        "string.empty": "New password is required",
        "string.min": "New password must be at least 8 characters",
        "string.max": "New password must not exceed 100 characters",
        "string.pattern.base":
          "Password must contain uppercase, lowercase, number and special character",
        "any.required": "New password is required",
      }),

  }).options({
    abortEarly: true,
    allowUnknown: false,
    stripUnknown: true,
  });

  const { error } = schema.validate(data);

  return error ? error.details[0].message : null;
};