const safeParse = (value, defaultValue) => {

  if (value === null || value === undefined) {
    return defaultValue;
  }

  if (Array.isArray(value) || typeof value === "object") {
    return value;
  }

  if (typeof value === "string") {
    try {
      return JSON.parse(value);
    } catch {
      return defaultValue;
    }
  }

  return defaultValue;
};

module.exports = safeParse;