const doctorRegistrationService = require("../../services/doctorVerification/doctorRegistrationService");

exports.createDoctorRegistration = async (req, res) => {
    try {
        const result = await doctorRegistrationService.createDoctorRegistration(req.body);

        return res.status(result.statusCode).json(result);

    } catch (error) {
        console.error("CREATE DOCTOR REGISTRATION ERROR:", error);

        return res.status(500).json({
            success: false,
            statusCode: 500,
            message: "Internal server error."
        });
    }
};

exports.getDoctorRegistrationById = async (req, res) => {
    try {
        const { id } = req.params;

        const result = await doctorRegistrationService.getDoctorRegistrationById(id);

        return res.status(result.statusCode).json(result);

    } catch (error) {
        console.error("GET DOCTOR REGISTRATION ERROR:", error);

        return res.status(500).json({
            success: false,
            statusCode: 500,
            message: "Internal server error."
        });
    }
};

exports.getAllDoctorRegistrations = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 10,
            search = "",
            status
        } = req.query;

        const result = await doctorRegistrationService.getAllDoctorRegistrations({
            page: Number(page),
            limit: Number(limit),
            search,
            status
        });

        return res.status(result.statusCode).json(result);

    } catch (error) {
        console.error("GET ALL DOCTOR REGISTRATIONS ERROR:", error);

        return res.status(500).json({
            success: false,
            statusCode: 500,
            message: "Internal server error."
        });
    }
};

exports.updateDoctorRegistration = async (req, res) => {
    try {
        const { id } = req.params;

        const result = await doctorRegistrationService.updateDoctorRegistration(
            id,
            req.body
        );

        return res.status(result.statusCode).json(result);

    } catch (error) {
        console.error("UPDATE DOCTOR REGISTRATION ERROR:", error);

        return res.status(500).json({
            success: false,
            statusCode: 500,
            message: "Internal server error."
        });
    }
};

exports.submitDoctorRegistration = async (req, res) => {
    try {
        const { id } = req.params;

        const result = await doctorRegistrationService.submitDoctorRegistration(id);

        return res.status(result.statusCode).json(result);

    } catch (error) {
        console.error("SUBMIT DOCTOR REGISTRATION ERROR:", error);

        return res.status(500).json({
            success: false,
            statusCode: 500,
            message: "Internal server error."
        });
    }
};

exports.deleteDoctorRegistration = async (req, res) => {
    try {
        const { id } = req.params;

        const result = await doctorRegistrationService.deleteDoctorRegistration(id);

        return res.status(result.statusCode).json(result);

    } catch (error) {
        console.error("DELETE DOCTOR REGISTRATION ERROR:", error);

        return res.status(500).json({
            success: false,
            statusCode: 500,
            message: "Internal server error."
        });
    }
};

exports.sendEmailOtp = async (req, res) => {
    try {

        const result = await doctorRegistrationService.sendEmailOtp(req.body);

        return res.status(result.statusCode).json(result);

    } catch (error) {

        console.error("SEND EMAIL OTP ERROR:", error);

        return res.status(500).json({
            success: false,
            statusCode: 500,
            message: "Internal server error."
        });

    }
};

exports.verifyEmailOtp = async (req, res) => {
    try {

        const result = await doctorRegistrationService.verifyEmailOtp(req.body);

        return res.status(result.statusCode).json(result);

    } catch (error) {

        console.error("VERIFY EMAIL OTP ERROR:", error);

        return res.status(500).json({
            success: false,
            statusCode: 500,
            message: "Internal server error."
        });

    }
};