import React from 'react';
import './Input.css';

const Input = ({
  label,
  error,
  icon,
  endIcon,
  as: Component = 'input',
  className = '',
  disabled,
  ...props
}) => {
  return (
    <div className={`input-wrapper ${className}`}>
      {label && <label className="input-label">{label}</label>}
      <div className={`input-container ${error ? 'input-error' : ''} ${disabled ? 'input-disabled' : ''}`}>
        {icon && <span className="input-icon">{icon}</span>}
        <Component
          className={`input-field ${icon ? 'has-icon' : ''} ${endIcon ? 'has-end-icon' : ''}`}
          disabled={disabled}
          {...props}
        />
        {endIcon && <span className="input-end-icon">{endIcon}</span>}
      </div>
      {error && <span className="error-message">{error}</span>}
    </div>
  );
};

export default Input;
