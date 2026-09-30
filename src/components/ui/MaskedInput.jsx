import React, { useState, useEffect, useRef } from 'react';
import Input from './Input';
import './MaskedInput.css';

const convertIsoToBr = (isoStr) => {
  if (!isoStr) return '';
  const [yyyy, mm, dd] = isoStr.split('-');
  if (yyyy && mm && dd) return `${dd}/${mm}/${yyyy}`;
  return '';
};

const convertBrToIso = (brStr) => {
  if (!brStr || brStr.length !== 10) return '';
  const [dd, mm, yyyy] = brStr.split('/');
  if (dd && mm && yyyy && yyyy.length === 4) return `${yyyy}-${mm.padStart(2, '0')}-${dd.padStart(2, '0')}`;
  return '';
};

const applyMask = (value, mask) => {
  if (!value) return '';
  const onlyNumbers = value.replace(/\D/g, '');
  
  if (mask === 'cpf') {
    return onlyNumbers
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})/, '$1-$2')
      .replace(/(-\d{2})\d+?$/, '$1');
  }
  
  if (mask === 'cpfCnpj') {
    if (onlyNumbers.length <= 11) {
      return onlyNumbers
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d{1,2})/, '$1-$2')
        .replace(/(-\d{2})\d+?$/, '$1');
    }
    return onlyNumbers
      .slice(0, 14)
      .replace(/(\d{2})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1/$2')
      .replace(/(\d{4})(\d{1,2})/, '$1-$2')
      .replace(/(-\d{2})\d+?$/, '$1');
  }
  
  if (mask === 'cnpj') {
    return onlyNumbers
      .replace(/(\d{2})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1/$2')
      .replace(/(\d{4})(\d{1,2})/, '$1-$2')
      .replace(/(-\d{2})\d+?$/, '$1');
  }
  
  if (mask === 'phone') {
    if (onlyNumbers.length <= 10) {
      return onlyNumbers
        .replace(/(\d{2})(\d)/, '($1) $2')
        .replace(/(\d{4})(\d{1,4})/, '$1-$2');
    }
    return onlyNumbers
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{5})(\d{1,4})/, '$1-$2')
      .replace(/(-\d{4})\d+?$/, '$1');
  }
  
  if (mask === 'date') {
    return onlyNumbers
      .replace(/(\d{2})(\d)/, '$1/$2')
      .replace(/(\d{2})(\d)/, '$1/$2')
      .replace(/(\/\d{4})\d+?$/, '$1');
  }
  
  if (mask === 'currency') {
    const amount = new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(onlyNumbers / 100);
    return amount;
  }
  
  return value;
};

const MaskedInput = ({ mask, value, onChange, ...props }) => {
  const [internalValue, setInternalValue] = useState(value || '');
  const dateInputRef = useRef(null);

  useEffect(() => {
    setInternalValue(applyMask(value || '', mask));
  }, [value, mask]);

  const handleChange = (e) => {
    const maskedValue = applyMask(e.target.value, mask);
    setInternalValue(maskedValue);
    if (onChange) {
      const event = { ...e, target: { ...e.target, value: maskedValue } };
      onChange(event);
    }
  };

  const handleDatePickerChange = (e) => {
    const brDate = convertIsoToBr(e.target.value);
    if (brDate) {
      setInternalValue(brDate);
      if (onChange) {
        onChange({ target: { name: props.name, value: brDate } });
      }
    }
  };

  const openDatePicker = () => {
    if (dateInputRef.current) {
      if (typeof dateInputRef.current.showPicker === 'function') {
        dateInputRef.current.showPicker();
      } else {
        dateInputRef.current.click();
      }
    }
  };

  let endIcon = props.endIcon;

  if (mask === 'date' && !endIcon) {
    endIcon = (
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
        <button
          type="button"
          onClick={openDatePicker}
          style={{
            background: 'none',
            border: 'none',
            padding: '2px',
            cursor: 'pointer',
            color: '#0D6E3F',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '4px',
            transition: 'background 0.2s',
          }}
          title="Abrir seletor de data"
          aria-label="Abrir seletor de data no calendário"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
            <line x1="16" y1="2" x2="16" y2="6"></line>
            <line x1="8" y1="2" x2="8" y2="6"></line>
            <line x1="3" y1="10" x2="21" y2="10"></line>
          </svg>
        </button>
        <input
          type="date"
          ref={dateInputRef}
          value={convertBrToIso(internalValue)}
          onChange={handleDatePickerChange}
          style={{
            position: 'absolute',
            top: 0,
            right: 0,
            width: '100%',
            height: '100%',
            opacity: 0,
            pointerEvents: 'none',
          }}
          tabIndex={-1}
        />
      </div>
    );
  }

  return (
    <Input
      value={internalValue}
      onChange={handleChange}
      endIcon={endIcon}
      {...props}
    />
  );
};

export default MaskedInput;
