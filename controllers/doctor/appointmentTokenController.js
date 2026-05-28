const service = require("../../services/doctor/appointmentTokenService");


exports.verifyToken = async (req, res) => {
  try {
    const { token } = req.params;

    const data = await service.verifyToken(token);

    res.status(200).json({
      success: true,
      message: "Token valid and appointment completed",
      data
    });

  } catch (err) {
    res.status(400).json({
      success: false,
      message: err.message
    });
  }
};
exports.start = async (req, res, next) => {
  try {
    const result = await service.start(req.params.id);

    res.status(200).json({
      success: true,
      message: result.message
    });

  } catch (err) {
    next(err);
  }
};

exports.getDetails = async (req, res) => {
  try {
    const data = await service.getDetails(req.params.id);
    res.json(data);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.complete = async (req, res, next) => {
  try {
    const result = await service.complete(req.params.id);

    res.status(200).json({
      success: true,
      message: result.message
    });

  } catch (err) {
    next(err);
  }
};

exports.completeByToken = async (req, res, next) => {
  try {
    const { token } = req.params;
    const result = await service.completeByToken(token);

    res.status(200).json({
      success: true,
      message: result.message
    });
  } catch (err) {
    next(err);
  }
};

exports.editPrescription = async (req, res) => {
  try {
    const { id } = req.params;
    const { medicines } = req.body;

    if (!medicines || medicines.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Medicines required"
      });
    }

    const result = await service.editPrescription(id, medicines);

    res.json({
      success: true,
      message: result.message
    });

  } catch (err) {
    res.status(400).json({
      success: false,
      message: err.message
    });
  }
};

exports.revisit = async (req, res) => {
  try {
    const data = await service.revisit(
      req.params.patientId,
      req.params.doctorId
    );
    res.json(data);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};



exports.getPrescription = async (req, res) => {
  try {
    const { appointment_id } = req.query;

if (!appointment_id) {
  return res.status(400).json({
    success: false,
    message: "appointment_id is required"
  });
}

const data = await service.getFullPrescription(appointment_id);

    res.json({
      success: true,
      data
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};