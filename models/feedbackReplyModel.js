const db = require("../config/db");
const { validateCreateReply, validateFeedbackId } = require("../validations/feedbackReplyValidation");

const FeedbackReply = {

  async create({ feedback_id, doctor_id, reply_text }) {
    const error = validateCreateReply(feedback_id, doctor_id, reply_text);
    if (error) {
      return { success: false, statusCode: 400, message: error };
    }
    const [result] = await db.query(
      `INSERT INTO feedback_replies (feedback_id, doctor_id, reply_text)
       VALUES (?, ?, ?)`,
      [feedback_id, doctor_id, reply_text.trim()]
    );

    return {
      success: true,
      statusCode: 201,
      data: { reply_id: result.insertId }
    };
  },

  async findByFeedbackId(feedback_id) {

    const error = validateFeedbackId(feedback_id);
    if (error) {
      return { success: false, statusCode: 400, message: error };
    }

    const [rows] = await db.query(
      `SELECT * FROM feedback_replies WHERE feedback_id = ?`,
      [feedback_id]
    );

    return {
      success: true,
      statusCode: 200,
      data: rows
    };
  }
};

module.exports = FeedbackReply;