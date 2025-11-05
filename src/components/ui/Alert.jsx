const Alert = ({ 
  children, 
  type = 'info',
  onClose 
}) => {
  const variants = {
    info: 'bg-blue-50 border-blue-200 text-blue-800',
    success: 'bg-green-50 border-green-200 text-green-800',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    danger: 'bg-red-50 border-red-200 text-red-800'
  };

  const icons = {
    info: 'ℹ️',
    success: '✓',
    warning: '⚠️',
    danger: '✕'
  };

  return (
    <div className={`border rounded-lg p-4 ${variants[type]}`}>
      <div className="flex items-start">
        <span className="mr-2 text-lg">{icons[type]}</span>
        <div className="flex-1">{children}</div>
        {onClose && (
          <button
            onClick={onClose}
            className="ml-2 text-lg hover:opacity-70"
          >
            ×
          </button>
        )}
      </div>
    </div>
  );
};

export default Alert;





