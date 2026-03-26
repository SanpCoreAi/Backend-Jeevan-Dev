exports.validateRequest = (schema) => {
  return (req, res, next) => {

    if (!schema || typeof schema.validate !== "function") {
      console.error("❌ Invalid schema:", schema);

      return res.status(500).json({
        success: false,
        statusCode: 500,
        message: "Validation schema is not defined correctly"
      });
    }

    const { error } = schema.validate(req.body);

    if (error) {
      return res.status(422).json({
        success: false,
        statusCode: 422,
        message: error.details[0].message
      });
    }

    next();
  };
};
