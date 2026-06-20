const Joi=require("joi");


exports.createFeedbackValidation=(data)=>{

const schema=Joi.object({

feedback_text:Joi.string()
.min(5)
.max(500)
.required()
.messages({
"string.empty":"Feedback text required",
"string.min":"Feedback minimum 5 characters",
"string.max":"Feedback maximum 500 characters"
}),


rating:Joi.number()
.min(1)
.max(5)
.optional()
.messages({
"number.min":"Rating must be minimum 1",
"number.max":"Rating must be maximum 5"
})

});


const {error}=schema.validate(data,{
abortEarly:true
});


return error
? error.details[0].message
: null;

};