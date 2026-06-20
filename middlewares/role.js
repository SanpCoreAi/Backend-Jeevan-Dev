const allowRoles = (...roles) => {

  return (req, res, next) => {

    try {

      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: "User not authenticated"
        });
      }


      const userRole = req.user.role_id;


      if (!roles.includes(Number(userRole))) {

        return res.status(403).json({
          success: false,
          message: "You don't have permission to access this resource"
        });

      }


      next();


    } catch (error) {

      console.error(
        "ROLE CHECK ERROR:",
        error.message
      );


      return res.status(500).json({
        success: false,
        message: "Internal Server Error"
      });

    }

  };

};


module.exports = {
  allowRoles
};