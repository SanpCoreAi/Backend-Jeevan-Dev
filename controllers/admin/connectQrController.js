const QRService = require("../../services/admin/connectQrService");

exports.connectDoctorQr = async (req, res) => {
    try {

        if (!req.user || req.user.role !== 4) {
            return res.status(403).json({
                success: false,
                message: "Only admin can connect QR Code."
            });
        }

        const doctorId = Number(req.params.doctorId);
        const { qrCodes } = req.body;

        if (!doctorId || Number.isNaN(doctorId)) {
            return res.status(400).json({
                success: false,
                message: "Valid doctorId is required."
            });
        }

        if (!Array.isArray(qrCodes) || qrCodes.length === 0) {
            return res.status(400).json({
                success: false,
                message: "QR Codes are required."
            });
        }

        const invalidQr = qrCodes.find(
            (code) => typeof code !== "string" || !code.trim()
        );

        if (invalidQr) {
            return res.status(400).json({
                success: false,
                message: "Invalid QR Code."
            });
        }

        const result = await QRService.connectDoctorQr({
            doctorId,
            qrCodes: qrCodes.map(code => code.trim()),
            adminId: req.user.id
        });

        return res.status(result.statusCode).json(result);

    } catch (error) {

        console.error("Connect QR Error:", error);

        return res.status(500).json({
            success: false,
            message: "Internal server error."
        });

    }
};