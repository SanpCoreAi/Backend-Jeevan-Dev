
exports.validateUser = (data) => {
  
  if (!data.full_name) return "Full name is required";
  if (!data.email) return "Email is required";
  if (!data.phone_number) return "Phone number is required";
  if (!data.password) return "Password is required";

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(data.email)) {
    return "Invalid email format";
  }

  const phoneRegex = /^[0-9]{10}$/;
  if (!phoneRegex.test(data.phone_number)) {
    return "Phone number must be 10 digits";
  }

  if (data.password.length < 6) {
    return "Password must be at least 6 characters long";
  }

  if (data.doctor_id && isNaN(data.doctor_id)) {
    return "doctor_id must be a valid number";
  }

  if (data.role_id && isNaN(data.role_id)) {
    return "role_id must be a valid number";
  }

  return null; 
};
