import React from 'react';
import './Input.css';

const Input = ({
  label,
  error,
  icon,
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
          className={`input-field ${icon ? 'has-icon' : ''}`}
          disabled={disabled}
          {...props}
        />
      </div>
      {error && <span className="error-message">{error}</span>}
    </div>
  );
};

export default Input;
