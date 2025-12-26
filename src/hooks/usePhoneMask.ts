import { useState, useCallback, ChangeEvent } from 'react';

export const formatPhone = (value: string): string => {
  // Remove non-digits
  const digits = value.replace(/\D/g, '');
  
  // Apply Brazilian phone mask
  if (digits.length <= 2) {
    return digits.length > 0 ? `(${digits}` : '';
  } else if (digits.length <= 6) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  } else if (digits.length <= 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  } else {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
  }
};

export const usePhoneMask = (initialValue: string = '') => {
  const [value, setValue] = useState(formatPhone(initialValue));
  const [rawValue, setRawValue] = useState(initialValue.replace(/\D/g, ''));

  const handleChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value;
    const digits = input.replace(/\D/g, '').slice(0, 11);
    setRawValue(digits);
    setValue(formatPhone(digits));
  }, []);

  const isValid = rawValue.length >= 10 && rawValue.length <= 11;

  const reset = useCallback(() => {
    setValue('');
    setRawValue('');
  }, []);

  return {
    value,
    rawValue,
    onChange: handleChange,
    isValid,
    reset,
  };
};
