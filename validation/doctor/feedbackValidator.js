exports.validateCreateFeedback = (user_id, doctor_id, feedback_text, rating) => {

  if (!user_id) return "user_id is required";
  if (isNaN(user_id)) return "user_id must be a number";

  if (!doctor_id) return "doctor_id is required";
  if (isNaN(doctor_id)) return "doctor_id must be a number";

  if (!feedback_text || feedback_text.trim().length === 0)
    return "feedback_text is required";

  if (feedback_text.trim().length < 5)
    return "feedback_text must be at least 5 characters long";

  if (rating !== null && rating !== undefined) {
    if (isNaN(rating)) return "rating must be a number";
    if (rating < 1 || rating > 5)
      return "rating must be between 1 and 5";
  }

  return null;
};

exports.validateDoctorId = (doctor_id) => {
  if (!doctor_id) return "doctor_id is required";
  if (isNaN(doctor_id)) return "doctor_id must be a number";
  return null;
};

exports.validateDoctorReply = (feedback_id, doctor_id, reply_text) => {

  if (!feedback_id) return "feedback_id is required";
  if (isNaN(feedback_id)) return "feedback_id must be a number";

  if (!doctor_id) return "doctor_id is required";
  if (isNaN(doctor_id)) return "doctor_id must be a number";

  if (!reply_text || reply_text.trim().length === 0)
    return "reply_text is required";

  if (reply_text.trim().length < 3)
    return "reply_text must be at least 3 characters long";

  return null;
};

exports.validateFeedbackId = (feedback_id) => {
  if (!feedback_id) return "feedback_id is required";
  if (isNaN(feedback_id)) return "feedback_id must be a number";
  return null;
};
