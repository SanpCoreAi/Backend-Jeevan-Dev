const assistantProfileService = require("../../services/assistant/assistantProfileService");

const {
  updateAssistantProfileValidation,
} = require("../../validation/assistant/assistantProfileValidator");


exports.getAssistantProfile = async (req, res) => {
  try {
    const userId = Number(req.user?.id);

    if (!Number.isInteger(userId) || userId <= 0) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized user.",
      });
    }

    const result =
      await assistantProfileService.getAssistantProfile(userId);

    return res.status(result.statusCode).json({
      success: result.statusCode < 400,
      message: result.body.message,
      data: result.body.data || null,
    });

  } catch (error) {

    console.error("GET ASSISTANT PROFILE ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      data: null,
    });
  }
};

exports.updateAssistantProfile = async (req, res) => {
  try {

    const userId = Number(req.user?.id);

    if (!Number.isInteger(userId) || userId <= 0) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized user.",
      });
    }

    const validationError =
      updateAssistantProfileValidation(req.body);

    if (validationError) {
      return res.status(400).json({
        success: false,
        message: validationError,
      });
    }

    const result =
      await assistantProfileService.updateAssistantProfile(
        userId,
        req.body
      );

    return res.status(result.statusCode).json({
      success: result.success,
      message: result.message || result.body?.message,
      data: result.data || result.body?.data || null,
    });

  } catch (error) {

    console.error("UPDATE ASSISTANT PROFILE ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      data: null,
    });
  }
};

exports.getAllAssistantProfiles = async (req, res) => {
  try {

    const doctorId = Number(req.params.doctorId);

    if (!Number.isInteger(doctorId) || doctorId <= 0) {
      return res.status(400).json({
        success: false,
        message: "Valid doctor id is required.",
      });
    }

    const result =
      await assistantProfileService.getAllAssistantProfiles(
        doctorId
      );

    return res.status(result.statusCode).json({
      success: result.statusCode < 400,
      message: result.body.message,
      count: result.body.results || 0,
      data: result.body.data || [],
    });

  } catch (error) {

    console.error("GET ALL ASSISTANT PROFILE ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      count: 0,
      data: [],
    });
  }
};

exports.getAllAssistantProfile = async (req, res) => {
  try {

    const result =
      await assistantProfileService.getAllAssistantProfile();

    return res.status(result.statusCode).json({
      success: result.success,
      message: result.body.message,
      count: result.body.count || 0,
      data: result.body.data || []
    });

  } catch (error) {

    console.error(
      "GET ALL ASSISTANT PROFILES ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      data: []
    });
  }
};