const service = require("../../services/doctor/prescriptionService");

exports.save = async (req, res, next) => {
  try {
    
    const { appointmentId, medicines } = req.body;
    

    await service.save(appointmentId, medicines);

    res.json({ message: "Prescription saved" });
  } catch (err) {
    next(err);
  }
};