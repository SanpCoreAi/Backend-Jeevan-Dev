const { validationResult } = require("express-validator");
const AppError = require("../utils/appError");

exports.validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const msg = errors.array().map((err) => err.msg).join(", ");
    return next(new AppError(msg, 400));
  }
  next();
};

exports.validate = (schema) => {

    return (req,res,next)=>{

        const data = {
            ...req.params,
            ...req.body
        };


        const {error,value} =
        schema.validate(data,{
            abortEarly:false,
            stripUnknown:true
        });



        if(error){

            return res.status(400).json({

                success:false,

                message:"Validation failed.",

                errors:
                error.details.map(err=>err.message)

            });

        }



        req.body = value;

        next();

    };

};