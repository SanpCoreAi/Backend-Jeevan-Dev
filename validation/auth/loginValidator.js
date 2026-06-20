const Joi = require("joi");


exports.loginValidation = (data)=>{


const schema = Joi.object({

 email:
 Joi.string()
 .email()
 .lowercase()
 .trim()
 .required()
 .messages({

 "string.email":
 "Invalid email",

 "any.required":
 "Email is required"

 }),


 password:
 Joi.string()
 .min(8)
 .required()
 .messages({

 "string.min":
 "Password minimum 8 characters",

 "any.required":
 "Password is required"

 })

});



const {error} =
schema.validate(data);


return error
? error.details[0].message
:null;


};