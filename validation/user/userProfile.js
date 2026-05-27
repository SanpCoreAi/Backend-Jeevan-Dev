function validateUserProfile(data) {
  const errors = [];

  if (!data.username || typeof data.username !== "string") {
    errors.push("Username is required and must be a string");
  }

  if (data.age && typeof data.age !== "number") {
    errors.push("Age must be a number");
  }

  if (data.language && !Array.isArray(data.language)) {
    errors.push("Language must be an array");
  }

  if (data.address && typeof data.address !== "object") {
    errors.push("Address must be an object");
  }

  if (data.existing_conditions && !Array.isArray(data.existing_conditions)) {
    errors.push("Existing conditions must be an array");
  }

  if (data.allergies && !Array.isArray(data.allergies)) {
    errors.push("Allergies must be an array");
  }

  if (data.emergency_contact && typeof data.emergency_contact !== "object") {
    errors.push("Emergency contact must be an object");
  }

  return errors;
}

module.exports = { validateUserProfile };