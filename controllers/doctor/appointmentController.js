const appointmentService = require("../../services/doctor/appointmentService");
const db = require("../../config/db");
const { bookAppointmentSchema } = require("../../validation/doctor/appointmentValidation");

exports.create = async (req, res) => {
  try {

    const { error, value } =
      bookAppointmentSchema.validate(req.body);

    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message
      });
    }

    const patientId = req.user.id;
    const doctorId = Number(req.params.doctorId);

    const [userRows] = await db.query(
      "SELECT email FROM users WHERE id = ?",
      [patientId]
    );

    const patientEmail = userRows[0]?.email;

    const result =
      await appointmentService.bookAppointment(
        patientId,
        patientEmail,
        doctorId,
        value
      );

    if (!result.success) {
      return res.status(400).json(result);
    }

    return res.status(201).json({
      success: true,
      appointment_id: result.data.appointmentId,
      appointment_token: result.data.appointmentToken
    });

  } catch (err) {

    console.log(err);

    return res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

exports.getDoctorAppointmentsForTable = async (req, res) => {

  try {

    let doctorId;


    // Doctor token
    if (req.user.role === 2) {

      doctorId = req.user.id;

    }


    // Assistant token
    else if (req.user.role === 3) {

      const user =
        await appointmentService.getUserById(
          req.user.id
        );


      if (!user || !user.doctor_id) {

        return res.status(404).json({
          success:false,
          message:"Doctor not found"
        });

      }


      doctorId = user.doctor_id;

    }


    else {

      return res.status(403).json({
        success:false,
        message:"Unauthorized role"
      });

    }



    const {
      hospitalName,
      page = 1,
      limit = 10
    } = req.query;



    if (!hospitalName) {

      return res.status(400).json({
        success:false,
        message:"hospitalName is required"
      });

    }



    const result =
      await appointmentService
        .getDoctorAppointmentsForTable(
          doctorId,
          hospitalName,
          Number(page),
          Number(limit)
        );



    return res.status(200).json(result);



  } catch(error) {

    console.log(error);

    return res.status(500).json({
      success:false,
      message:"Internal server error"
    });

  }

};


exports.getDashboardStats = async (req, res) => {
  try {
    const doctorId = req.user.id;

    const result = await appointmentService.getDashboardStats(doctorId);

    return res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.getAppointmentDetails = async (req, res) => {
  try {
    const doctorId = req.user.id;
    const appointmentId = parseInt(req.params.appointmentId);

    const result = await appointmentService.getAppointmentDetails(
      doctorId,
      appointmentId
    );

    if (!result.success) {
      return res.status(404).json(result);
    }

    return res.status(200).json(result);

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.getAppointmentById = async (req, res) => {
  try {

    let doctorId;

    // Doctor token
    if (req.user.role === 2) {

      doctorId = req.user.id;

    } 
    // Assistant token
    else if (req.user.role === 3) {

      const user = await appointmentService.getUserById(req.user.id);

      if (!user || !user.doctor_id) {
        return res.status(404).json({
          success: false,
          message: "Doctor not found for assistant"
        });
      }

      doctorId = user.doctor_id;

    } 
    else {

      return res.status(403).json({
        success: false,
        message: "Unauthorized role"
      });

    }


    const result = await appointmentService.getAppointmentById(
      doctorId
    );


    return res.status(200).json(result);


  } catch (error) {

    console.log(error);

    return res.status(500).json({
      success:false,
      message:error.message
    });

  }
};

exports.getTodayAppointments = async (req, res) => {

  try {

    let doctorId;


    // Doctor token
    if (req.user.role === 2) {

      doctorId = req.user.id;

    }


    // Assistant token
    else if (req.user.role === 3) {

      const user =
        await appointmentService.getUserById(
          req.user.id
        );


      if (!user || !user.doctor_id) {

        return res.status(404).json({
          success:false,
          message:"Doctor not found"
        });

      }


      doctorId = user.doctor_id;

    }


    else {

      return res.status(403).json({
        success:false,
        message:"Unauthorized role"
      });

    }



    const {
      page = 1,
      limit = 10
    } = req.query;



    const result =
      await appointmentService
      .getTodayAppointmentsService(
        doctorId,
        Number(page),
        Number(limit)
      );



    return res.status(200).json(result);



  } catch(error) {

    return res.status(500).json({
      success:false,
      message:"Internal server error",
      error:error.message
    });

  }
};

exports.getAppointmentPublicById = async (req, res) => {
  try {

    let patientId = req.params.patient_id;

    // agar doctor/assistant token se access karna hai
    if (req.user) {

      // Doctor
      if (req.user.role === 2) {

        patientId = req.params.patient_id;

      }

      // Assistant
      else if (req.user.role === 3) {

        const user = await appointmentService.getUserById(
          req.user.id
        );

        if (!user || !user.doctor_id) {
          return res.status(404).json({
            success:false,
            message:"Doctor not found"
          });
        }

        patientId = req.params.patient_id;

      }

      else {
        return res.status(403).json({
          success:false,
          message:"Unauthorized role"
        });
      }
    }


    const result =
      await appointmentService.getAppointmentPublicById(
        patientId
      );


    if (!result.success) {
      return res.status(404).json(result);
    }


    return res.status(200).json(result);


  } catch (error) {

    return res.status(500).json({
      success:false,
      message:error.message
    });

  }
};

exports.getDashboardCards = async (req, res) => {

  try {

    let doctorId;


    // Doctor token
    if (req.user.role === 2) {

      doctorId = req.user.id;

    }


    // Assistant token
    else if (req.user.role === 3) {

      const user =
        await appointmentService.getUserById(
          req.user.id
        );


      if (!user || !user.doctor_id) {

        return res.status(404).json({
          success:false,
          message:"Doctor not found"
        });

      }


      doctorId = user.doctor_id;

    }


    else {

      return res.status(403).json({
        success:false,
        message:"Unauthorized role"
      });

    }



    const data =
      await appointmentService.getDashboardCards({
        doctorId
      });



    return res.status(200).json({

      success:true,

      message:
        "Dashboard cards fetched successfully",

      data

    });


  } catch(error) {

    console.log(error);


    return res.status(500).json({

      success:false,

      message:"Something went wrong"

    });

  }

};


exports.getPatientDashboardCards = async (req, res) => {

  try {

    let doctorId;


    // Doctor token
    if (req.user.role === 2) {

      doctorId = req.user.id;

    }


    // Assistant token
    else if (req.user.role === 3) {

      const user =
        await appointmentService.getUserById(
          req.user.id
        );


      if (!user || !user.doctor_id) {

        return res.status(404).json({
          success:false,
          message:"Doctor not found"
        });

      }


      doctorId = user.doctor_id;

    }


    else {

      return res.status(403).json({
        success:false,
        message:"Unauthorized role"
      });

    }



    const data =
      await appointmentService
        .getPatientDashboardCards({
          doctorId
        });



    return res.status(200).json({

      success:true,

      message:
        "Patient dashboard cards fetched successfully",

      data

    });



  } catch(error) {

    console.log(error);


    return res.status(500).json({

      success:false,

      message:"Something went wrong"

    });

  }

};

exports.getMyAppointments = async (req, res) => {

  try {

    let userId;


    // Patient
    if (req.user.role === 1) {

      userId = req.user.id;

    }


    // Doctor
    else if (req.user.role === 2) {

      userId = req.user.id;

    }


    // Assistant
    else if (req.user.role === 3) {

      const user =
        await appointmentService.getUserById(
          req.user.id
        );


      if (!user || !user.doctor_id) {

        return res.status(404).json({
          success:false,
          message:"Doctor not found"
        });

      }


      userId = user.doctor_id;

    }


    else {

      return res.status(403).json({
        success:false,
        message:"Unauthorized role"
      });

    }



    const result =
      await appointmentService.getMyAppointments(
        userId
      );


    return res.status(200).json({

      success:true,

      count: result.data.length,

      data: result.data

    });


  } catch(error) {

    return res.status(500).json({

      success:false,

      message:error.message

    });

  }

};

exports.getDoctorSlots = async (req, res) => {
  try {
    const { doctorId, hospitalName, date } = req.query;

    if (!doctorId || !hospitalName || !date) {
      return res.status(400).json({
        success: false,
        message: "doctorId, hospitalName and date are required",
      });
    }

    const data = await appointmentService.getDoctorSlots({
      doctorId,
      hospitalName,
      date,
    });

    res.status(200).json({
      success: true,
      ...data,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};