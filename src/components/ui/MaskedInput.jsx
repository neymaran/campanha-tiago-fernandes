import React, { useState, useEffect } from 'react';
import Input from './Input';
import './MaskedInput.css';

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

  return (
    <Input
      value={internalValue}
      onChange={handleChange}
      {...props}
    />
  );
};

export default MaskedInput;
