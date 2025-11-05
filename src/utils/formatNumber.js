// Format number with dot as thousand separator
export const formatNumberWithDots = (value) => {
  if (!value && value !== 0) return '';
  return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
};

// Parse formatted number (remove dots)
export const parseFormattedNumber = (value) => {
  if (!value) return '';
  return value.toString().replace(/\./g, '');
};

// Format currency for input (editing)
export const formatCurrencyInput = (value) => {
  const parsed = parseFormattedNumber(value);
  return formatNumberWithDots(parsed);
};

// Handle number input change
export const handleNumberInputChange = (value, callback) => {
  // Remove non-numeric characters
  const numericValue = value.replace(/[^\d]/g, '');
  const formatted = formatNumberWithDots(numericValue);
  callback(formatted);
};





