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
        const { qrCode } = req.body;

        if (!doctorId || Number.isNaN(doctorId)) {
            return res.status(400).json({
                success: false,
                message: "Valid doctorId is required."
            });
        }

        if (!qrCode || typeof qrCode !== "string" || !qrCode.trim()) {
            return res.status(400).json({
                success: false,
                message: "QR Code is required."
            });
        }

        const result = await QRService.connectDoctorQr({
            doctorId,
            qrCode: qrCode.trim(),
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