const Joi = require("joi");


// CREATE

exports.createAssistantProfileValidation = (data)=>{
const schema = Joi.object({
gender:Joi.string()
.valid("male","female","other")
.required(),


age:Joi.number()
.min(18)
.max(80)
.optional(),


department:Joi.string()
.min(2)
.max(100)
.required(),


education:Joi.string()
.min(2)
.max(200)
.required(),


experience:Joi.number()
.min(0)
.optional(),


language:Joi.array()
.items(Joi.string())
.optional(),


address:Joi.object()
.optional(),


bio:Joi.string()
.max(500)
.allow("")
.optional()


});



const {error}=schema.validate(data,{

abortEarly:true

});


return error
? error.details[0].message
: null;


};








// UPDATE


exports.updateAssistantProfileValidation = (data)=>{


const schema = Joi.object({
gender:Joi.string()
.valid("male","female","other")
.optional(),


age:Joi.number()
.min(18)
.max(80)
.optional(),


department:Joi.string()
.min(2)
.max(100)
.optional(),


education:Joi.string()
.min(2)
.max(200)
.optional(),


experience:Joi.number()
.min(0)
.optional(),


language:Joi.array()
.items(Joi.string())
.optional(),


address:Joi.object()
.optional(),


bio:Joi.string()
.max(500)
.allow("")
.optional()


});



const {error}=schema.validate(data,{

abortEarly:true

});



return error
? error.details[0].message
: null;


};