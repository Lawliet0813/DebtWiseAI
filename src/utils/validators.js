import AppError from '../errors/AppError.js';

function getString(data, field, options = {}) {
  const { required = true, minLength = 0, maxLength = Infinity, pattern, transform = (v) => v.trim(), defaultValue = null } = options;
  const raw = data[field];
  if (raw === undefined || raw === null) {
    if (required) {
      throw new AppError(400, `${field} is required.`);
    }
    return defaultValue;
  }
  if (typeof raw !== 'string') {
    throw new AppError(400, `${field} must be a string.`);
  }
  const value = transform(raw);
  if (value.length < minLength) {
    throw new AppError(400, `${field} must be at least ${minLength} characters.`);
  }
  if (value.length > maxLength) {
    throw new AppError(400, `${field} must be at most ${maxLength} characters.`);
  }
  if (pattern && !pattern.test(value)) {
    throw new AppError(400, `${field} has an invalid format.`);
  }
  return value;
}

function getNumber(data, field, options = {}) {
  const { required = true, min = -Infinity, max = Infinity, defaultValue = null } = options;
  const raw = data[field];
  if (raw === undefined || raw === null || raw === '') {
    if (required) {
      throw new AppError(400, `${field} is required.`);
    }
    return defaultValue;
  }
  const value = Number(raw);
  if (Number.isNaN(value)) {
    throw new AppError(400, `${field} must be a number.`);
  }
  if (value < min) {
    throw new AppError(400, `${field} must be greater than or equal to ${min}.`);
  }
  if (value > max) {
    throw new AppError(400, `${field} must be less than or equal to ${max}.`);
  }
  return value;
}

function getDate(data, field, options = {}) {
  const { required = true, defaultValue = null } = options;
  const raw = data[field];
  if (raw === undefined || raw === null || raw === '') {
    if (required) {
      throw new AppError(400, `${field} is required.`);
    }
    return defaultValue;
  }
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) {
    throw new AppError(400, `${field} must be a valid date.`);
  }
  return date;
}

function getEnum(data, field, values, options = {}) {
  const { required = true, defaultValue = null } = options;
  const raw = data[field];
  if (raw === undefined || raw === null || raw === '') {
    if (required) {
      throw new AppError(400, `${field} is required.`);
    }
    return defaultValue;
  }
  if (!values.includes(raw)) {
    throw new AppError(400, `${field} must be one of: ${values.join(', ')}.`);
  }
  return raw;
}

function ensureEmail(value, field = 'email') {
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailPattern.test(value)) {
    throw new AppError(400, `${field} must be a valid email address.`);
  }
  return value.toLowerCase();
}

export {
  getString,
  getNumber,
  getDate,
  getEnum,
  ensureEmail,
};
