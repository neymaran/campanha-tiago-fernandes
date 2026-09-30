import React, { useState, useRef, useEffect } from 'react';
import './Select.css';

const Select = ({ options, value, onChange, placeholder = 'Select...', label, error }) => {
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

  const filteredOptions = options.filter(opt => 
    opt.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedOption = options.find(opt => opt.value === value);

  return (
    <div className="select-wrapper" ref={wrapperRef}>
      {label && <label className="select-label">{label}</label>}
      <div 
        className={`select-trigger ${error ? 'select-error' : ''} ${isOpen ? 'open' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <span>{selectedOption ? selectedOption.label : placeholder}</span>
        <span className="select-arrow">▼</span>
      </div>
      
      {isOpen && (
        <div className="select-dropdown">
          <input 
            type="text" 
            className="select-search" 
            placeholder="Search..."
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
                  onClick={() => {
                    onChange(opt.value);
                    setIsOpen(false);
                    setSearchTerm('');
                  }}
                >
                  {opt.label}
                </li>
              ))
            ) : (
              <li className="select-no-results">No options found</li>
            )}
          </ul>
        </div>
      )}
      {error && <span className="select-error-msg">{error}</span>}
    </div>
  );
};

export default Select;
