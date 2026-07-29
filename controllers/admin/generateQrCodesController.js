const QRService = require("../../services/admin/generateQrCodesService");

exports.generateQrCodes = async (req, res) => {
    try {
        if (!req.user || req.user.role !== 4) {
            return res.status(403).json({
                success: false,
                message: "Only admin can generate QR Codes."
            });
        }

        const count = Number(req.body.count || 50);

        if (!Number.isInteger(count) || count <= 0 || count > 500) {
            return res.status(400).json({
                success: false,
                message: "Count must be between 1 and 500."
            });
        }

        const result = await QRService.generateQrCodes(count);

        return res.status(result.statusCode).json(result);

    } catch (error) {
        console.error("Generate QR Error:", error);

        return res.status(500).json({
            success: false,
            message: "Internal server error."
        });
    }
};

exports.getAllQrCodes = async (req, res) => {
    try {

        if (!req.user || req.user.role !== 4) {
            return res.status(403).json({
                success: false,
                message: "Only admin can access QR Codes."
            });
        }

        const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
        const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 10, 1), 100);
        const status = req.query.status?.trim() || "";

        const result = await QRService.getAllQrCodes({
            page,
            limit,
            status
        });

        return res.status(result.statusCode).json(result);

    } catch (error) {

        console.error("Get QR Codes Error:", error);

        return res.status(500).json({
            success: false,
            message: "Internal server error."
        });

    }
};

exports.getDoctorQrCodes = async (req, res) => {
    try {

        const doctorId = Number(req.params.doctorId);

        if (!doctorId || Number.isNaN(doctorId)) {
            return res.status(400).json({
                success: false,
                message: "Valid doctorId is required."
            });
        }

        const result = await QRService.getDoctorQrCodes(doctorId);

        return res.status(result.statusCode).json(result);

    } catch (error) {

        console.error("Get Doctor QR Error:", error);

        return res.status(500).json({
            success: false,
            message: "Internal server error."
        });

    }
};

exports.getAllQrDetails = async (req, res) => {
    try {

        const page = Math.max(Number(req.query.page) || 1, 1);
        const limit = Math.min(Math.max(Number(req.query.limit) || 10, 1), 100);
        const status = req.query.status?.trim().toUpperCase() || "";

        const result = await QRService.getAllQrDetails({
            page,
            limit,
            status
        });

        return res.status(result.statusCode).json(result);

    } catch (error) {

        console.error("Get QR Details Error:", error);

        return res.status(500).json({
            success: false,
            message: "Internal server error."
        });

    }
};