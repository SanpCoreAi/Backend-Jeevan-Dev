exports.validateCreateReply = (feedback_id, doctor_id, reply_text) => {

  if (!feedback_id) {
    return "feedback_id is required";
  }
  if (isNaN(feedback_id)) {
    return "feedback_id must be a number";
  }

  if (!doctor_id) {
    return "doctor_id is required";
  }
  if (isNaN(doctor_id)) {
    return "doctor_id must be a number";
  }

  if (!reply_text || reply_text.trim().length === 0) {
    return "reply_text is required";
  }
  if (reply_text.trim().length < 3) {
    return "reply_text must be at least 3 characters long";
  }

  return null; 
};

exports.validateFeedbackId = (feedback_id) => {

  if (!feedback_id) {
    return "feedback_id is required";
  }
  if (isNaN(feedback_id)) {
    return "feedback_id must be a number";
  }

  return null;
};
