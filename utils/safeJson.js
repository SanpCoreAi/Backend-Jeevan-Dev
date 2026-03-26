const safeJSON = (value, fallback = []) => {
  if (value === null || value === undefined) return fallback;

  if (typeof value === "object") return value;

  if (typeof value === "string") {
    try {
      return JSON.parse(value);
    } catch (e) {
      return fallback;
    }
  }

  return fallback;
};

module.exports = {
  safeJSON,
};