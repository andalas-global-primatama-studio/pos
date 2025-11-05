const Select = ({ 
  label,
  value,
  onChange,
  options = [],
  error,
  disabled = false,
  required = false,
  placeholder = 'Pilih...',
  className = '',
  ...props 
}) => {
  const selectClasses = `
    w-full px-3 py-2 border rounded-lg 
    ${error ? 'border-red-500' : 'border-gray-300'} 
    ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}
    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
    ${className}
  `;

  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <select
        value={value}
        onChange={onChange}
        disabled={disabled}
        required={required}
        className={selectClasses}
        {...props}
      >
        <option value="">{placeholder}</option>
        {options.map(option => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
};

export default Select;





