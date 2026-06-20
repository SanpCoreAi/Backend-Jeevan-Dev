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