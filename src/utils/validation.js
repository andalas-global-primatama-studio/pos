// Validation helper functions

export const validateEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

export const validatePhone = (phone) => {
  // Remove non-numeric characters
  const cleaned = phone.replace(/\D/g, '');
  // Check if it's a valid phone number (10-13 digits)
  return cleaned.length >= 10 && cleaned.length <= 13;
};

export const validateRequired = (value) => {
  if (typeof value === 'string') {
    return value.trim().length > 0;
  }
  return value !== null && value !== undefined;
};

export const validateMinLength = (value, min) => {
  if (typeof value === 'string') {
    return value.length >= min;
  }
  return false;
};

export const validateNumber = (value) => {
  return !isNaN(value) && isFinite(value) && value >= 0;
};

export const validatePositiveNumber = (value) => {
  return validateNumber(value) && value > 0;
};

// Form validation helpers
export const getFieldError = (field, value, rules) => {
  if (!rules) return '';

  if (rules.required && !validateRequired(value)) {
    return `${field} harus diisi`;
  }

  if (rules.minLength && !validateMinLength(value, rules.minLength)) {
    return `${field} minimal ${rules.minLength} karakter`;
  }

  if (rules.email && value && !validateEmail(value)) {
    return 'Format email tidak valid';
  }

  if (rules.phone && value && !validatePhone(value)) {
    return 'Format nomor telepon tidak valid';
  }

  if (rules.number && value && !validateNumber(value)) {
    return `${field} harus berupa angka`;
  }

  if (rules.positive && value && !validatePositiveNumber(value)) {
    return `${field} harus lebih besar dari 0`;
  }

  return '';
};

// Validate entire form
export const validateForm = (formData, rules) => {
  const errors = {};
  
  Object.keys(rules).forEach(field => {
    const value = formData[field];
    const fieldRules = rules[field];
    const error = getFieldError(field, value, fieldRules);
    
    if (error) {
      errors[field] = error;
    }
  });

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};





