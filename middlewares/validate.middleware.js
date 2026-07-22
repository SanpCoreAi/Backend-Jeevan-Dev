const validate = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body, {
      abortEarly: false
    });

    if (error) {
      return res.status(422).json({
        success: false,
        message: "Validation error",
        errors: error.details.map(err => err.message)
      });
    }

    next();
  };
};

module.exports = (schema) => {

    return (req, res, next) => {

        const { error } = schema.validate(req.body, {

            abortEarly: false,

            allowUnknown: false

        });

        if (error) {

            return res.status(400).json({

                success: false,

                message: error.details
                    .map(x => x.message)
                    .join(", ")

            });

        }

        next();

    };

};

module.exports = validate;
