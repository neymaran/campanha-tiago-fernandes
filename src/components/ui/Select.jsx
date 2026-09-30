import React, { useState, useRef, useEffect } from 'react';
import './Select.css';

const Select = ({ 
  options = [], 
  value, 
  onChange, 
  placeholder = 'Selecione...', 
  label, 
  error, 
  name,
  className = '',
  disabled = false,
  ...props 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const wrapperRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const safeOptions = Array.isArray(options) ? options : [];

  const filteredOptions = safeOptions.filter(opt => 
    opt && opt.label && opt.label.toString().toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedOption = safeOptions.find(opt => opt && opt.value === value);

  const handleSelectOption = (optValue, e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (onChange) {
      const syntheticEvent = {
        target: { name: name || '', value: optValue }
      };
      onChange(syntheticEvent, optValue);
    }
    setIsOpen(false);
    setSearchTerm('');
  };

  return (
    <div className={`select-wrapper ${className}`} ref={wrapperRef}>
      {label && <label className="select-label">{label}</label>}
      <div 
        className={`select-trigger ${error ? 'select-error' : ''} ${isOpen ? 'open' : ''} ${disabled ? 'disabled' : ''}`}
        onClick={() => !disabled && setIsOpen(!isOpen)}
      >
        <span>{selectedOption ? selectedOption.label : placeholder}</span>
        <span className="select-arrow">▼</span>
      </div>
      
      {isOpen && (
        <div className="select-dropdown">
          <input 
            type="text" 
            className="select-search" 
            placeholder="Buscar..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onClick={(e) => e.stopPropagation()}
            autoFocus
          />
          <ul className="select-options">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((opt) => (
                <li 
                  key={opt.value}
                  className={`select-option ${opt.value === value ? 'selected' : ''}`}
                  onMouseDown={(e) => handleSelectOption(opt.value, e)}
                  onClick={(e) => handleSelectOption(opt.value, e)}
                >
                  {opt.label}
                </li>
              ))
            ) : (
              <li className="select-no-results">Nenhuma opção encontrada</li>
            )}
          </ul>
        </div>
      )}
      {error && <span className="select-error-msg">{error}</span>}
    </div>
  );
};

export default Select;
