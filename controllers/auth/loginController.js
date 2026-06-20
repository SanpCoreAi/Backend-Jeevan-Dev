const {
  loginUser
} = require("../../services/auth/loginService");

const {
  loginValidation
} = require("../../validation/auth/loginValidator");


exports.login = async (req, res) => {

  try {


    const error =
      loginValidation(req.body);


    if (error) {

      return res.status(400).json({
        success:false,
        message:error
      });

    }



    const {
      email,
      password
    } = req.body;



    const result =
      await loginUser({
        email,
        password
      });



    return res
    .status(result.statusCode)
    .json({

      success:
      result.statusCode < 400,

      message:
      result.body.message,

      data:
      result.body.data || null

    });



  } catch (error) {


    console.error(
      "LOGIN CONTROLLER ERROR:",
      error
    );


    return res.status(500).json({

      success:false,

      message:
      "Internal Server Error"

    });


  }

};