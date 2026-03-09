import React, { forwardRef } from 'react';

const Input = forwardRef(({ 
  label, 
  error, 
  fullWidth = true, 
  className = '', 
  id, 
  ...props 
}, ref) => {
  const widthStyle = fullWidth ? 'w-full' : '';
  const errorStyle = error ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-slate-200 focus:ring-primary-100 focus:border-primary-500';
  
  return (
    <div className={`${widthStyle} ${className}`}>
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-slate-700 mb-1">
          {label}
        </label>
      )}
      <input
        id={id}
        ref={ref}
        className={`block px-3 py-2 bg-slate-50 border rounded-lg shadow-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:bg-white transition-all sm:text-sm ${errorStyle} ${widthStyle}`}
        {...props}
      />
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
});

Input.displayName = 'Input';
export default Input;
