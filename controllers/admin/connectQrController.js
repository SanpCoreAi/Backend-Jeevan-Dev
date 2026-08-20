const QRService = require("../../services/admin/connectQrService");

exports.connectDoctorQr = async (req, res) => {

    try {

        if (!req.user || Number(req.user.role) !== 4) {

            return res.status(403).json({
                success: false,
                message: "Only admin can connect QR Code."
            });
        }

        const doctorId = Number(req.params.doctorId);

        if (!Number.isInteger(doctorId) || doctorId <= 0) {

            return res.status(400).json({
                success: false,
                message: "Valid doctorId is required."
            });
        }

        const result = await QRService.connectDoctorQr({
            doctorId,
            qrCodes: req.body.qrCodes,
            adminId: req.user.id
        });

        return res
            .status(result.statusCode || 200)
            .json(result);

    } catch (error) {

        console.error(
            "Connect Doctor QR Controller Error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Internal server error."
        });
    }
};

exports.scanQr = async (req, res) => {
  try {
    const result = await QRService.scanQr({
      user: req.user,
      qrCode: req.body.qrCode
    });

    return res.status(result.statusCode).json(result.body);
  } catch (error) {
    console.error("Scan QR Error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error."
    });
  }
};

exports.changeDoctorStatus = async (req, res) => {
  try {

    const doctorId = Number(req.params.doctorId);

    const result =
      await QRService.changeDoctorStatus(doctorId);

    return res.status(result.statusCode).json({
      success: result.success,
      message: result.message
    });

  } catch (error) {

    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error."
    });

  }
};