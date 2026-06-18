const dashboardService = require('../../services/doctor/dashboardService');

exports.appointmentGraph = async (req, res) => {
  try {

    let doctorId;


    // Doctor token
    if (req.user.role === 2) {

      doctorId = req.user.id;

    }


    // Assistant token
    else if (req.user.role === 3) {

      const user = await dashboardService.getUserById(
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



    const data = await dashboardService.getAppointmentGraph(
      doctorId
    );


    res.status(200).json({
      success:true,
      data
    });



  } catch(error) {

    console.error(error);

    res.status(500).json({
      success:false,
      message:"Server Error"
    });

  }
};

exports.todayAppointmentStats = async (req, res) => {

  try {

    let doctorId;


    // Doctor token
    if (req.user.role === 2) {

      doctorId = req.user.id;

    }


    // Assistant token
    else if (req.user.role === 3) {

      const user = await dashboardService.getUserById(
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



    const data = await dashboardService.getTodayStats(
      doctorId
    );


    res.status(200).json({
      success:true,
      data
    });



  } catch(error){

    console.error(error);

    res.status(500).json({
      success:false,
      message:"Server Error"
    });

  }

};