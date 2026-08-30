function sanitizeErrorMessage() {
  return 'An error occurred. Please try again later.';
}

function sanitizeForLogging(data) {
  if (!data || typeof data !== 'object') {
    return data;
  }
  const sensitiveKeys = ['token', 'password', 'secret', 'apikey', 'api_key', 'authorization', 'cookie', 'session'];
  function recursiveSanitize(obj) {
    if (!obj || typeof obj !== 'object') {
      return obj;
    }
    const result = Array.isArray(obj) ? [] : {};
    for (const [key, value] of Object.entries(obj)) {
      const lowerKey = String(key).toLowerCase();
      const isSensitive = sensitiveKeys.some(sk => lowerKey.includes(sk));
      if (isSensitive) {
        result[key] = '[REDACTED]';
      } else if (value && typeof value === 'object') {
        result[key] = recursiveSanitize(value);
      } else {
        result[key] = value;
      }
    }
    return result;
  }
  return recursiveSanitize(Array.isArray(data) ? [...data] : { ...data });
}

module.exports = {
  sanitizeErrorMessage,
  sanitizeForLogging
};