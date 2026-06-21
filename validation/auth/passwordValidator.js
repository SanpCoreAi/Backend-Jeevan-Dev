const Joi=require("joi");


exports.forgotPasswordValidation=(data)=>{

const schema=Joi.object({

email:
Joi.string()
.email()
.required()

});


const {error}=schema.validate(data);


return error
?error.details[0].message
:null;

};

exports.resetPasswordValidation=(data)=>{

const schema=Joi.object({

token:
Joi.string()
.required(),

password:
Joi.string()
.min(8)
.pattern(
new RegExp(
"^(?=.*[A-Z])(?=.*[a-z])(?=.*[0-9])"
)
)
.required()

});


const {error}=schema.validate(data);


return error
?error.details[0].message
:null;

};

exports.changePasswordValidation=(data)=>{


const schema=Joi.object({

oldPassword:
Joi.string()
.required(),


newPassword:
Joi.string()
.min(8)
.pattern(
new RegExp(
"^(?=.*[A-Z])(?=.*[a-z])(?=.*[0-9])"
)
)
.required()

});


const {error}=schema.validate(data);


return error
?
error.details[0].message
:null;

};