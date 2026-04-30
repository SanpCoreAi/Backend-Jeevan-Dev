const service = require("../../services/doctor/appointmentTokenService");

exports.verifyToken = async (req, res) => {
  try {
    const { token } = req.params;   

    const data = await service.verifyToken(token);

    res.status(200).json({
      success: true,
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