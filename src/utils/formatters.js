/**
 * Utility functions for formatting and validation
 * Used across the campaign finance management app
 */

// ==================== FORMATTING ====================

/**
 * Format a number as Brazilian currency (R$)
 */
export function formatCurrency(value) {
  if (value === null || value === undefined || isNaN(value)) return 'R$ 0,00';
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

/**
 * Parse a Brazilian currency string to number
 * "R$ 1.500,00" -> 1500.00
 */
export function parseCurrency(str) {
  if (!str) return 0;
  const cleaned = str
    .replace(/[R$\s]/g, '')
    .replace(/\./g, '')
    .replace(',', '.');
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}

/**
 * Format CPF: 000.000.000-00
 */
export function formatCPF(value) {
  if (!value) return '';
  const digits = value.replace(/\D/g, '').slice(0, 11);
  return digits
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
}

/**
 * Format CNPJ: 00.000.000/0000-00
 */
export function formatCNPJ(value) {
  if (!value) return '';
  const digits = value.replace(/\D/g, '').slice(0, 14);
  return digits
    .replace(/(\d{2})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1/$2')
    .replace(/(\d{4})(\d{1,2})$/, '$1-$2');
}

/**
 * Format CPF or CNPJ based on length
 */
export function formatCPFCNPJ(value) {
  if (!value) return '';
  const digits = value.replace(/\D/g, '');
  if (digits.length <= 11) return formatCPF(value);
  return formatCNPJ(value);
}

/**
 * Format date: DD/MM/YYYY
 */
export function formatDate(value) {
  if (!value) return '';
  const digits = value.replace(/\D/g, '').slice(0, 8);
  return digits
    .replace(/(\d{2})(\d)/, '$1/$2')
    .replace(/(\d{2})(\d)/, '$1/$2');
}

/**
 * Format phone: (00) 00000-0000
 */
export function formatPhone(value) {
  if (!value) return '';
  const digits = value.replace(/\D/g, '').slice(0, 11);
  return digits
    .replace(/(\d{2})(\d)/, '($1) $2')
    .replace(/(\d{5})(\d)/, '$1-$2');
}

/**
 * Format currency input: 1.500,00
 */
export function formatCurrencyInput(value) {
  if (!value) return '';
  let digits = value.replace(/\D/g, '');
  if (!digits) return '';
  
  // Pad with leading zeros if needed
  while (digits.length < 3) digits = '0' + digits;
  
  const intPart = digits.slice(0, -2).replace(/^0+(?=\d)/, '') || '0';
  const decPart = digits.slice(-2);
  
  // Add thousand separators
  const formatted = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `${formatted},${decPart}`;
}


// ==================== VALIDATION ====================

/**
 * Validate CPF using the official algorithm
 */
export function validateCPF(cpf) {
  const digits = cpf.replace(/\D/g, '');
  
  if (digits.length !== 11) return false;
  
  // Check for known invalid patterns
  if (/^(\d)\1{10}$/.test(digits)) return false;
  
  // Validate first check digit
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(digits.charAt(i)) * (10 - i);
  }
  let remainder = 11 - (sum % 11);
  let checkDigit = remainder >= 10 ? 0 : remainder;
  if (parseInt(digits.charAt(9)) !== checkDigit) return false;
  
  // Validate second check digit
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(digits.charAt(i)) * (11 - i);
  }
  remainder = 11 - (sum % 11);
  checkDigit = remainder >= 10 ? 0 : remainder;
  if (parseInt(digits.charAt(10)) !== checkDigit) return false;
  
  return true;
}

/**
 * Validate CNPJ using the official algorithm
 */
export function validateCNPJ(cnpj) {
  const digits = cnpj.replace(/\D/g, '');
  
  if (digits.length !== 14) return false;
  
  // Check for known invalid patterns
  if (/^(\d)\1{13}$/.test(digits)) return false;
  
  // Validate first check digit
  const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    sum += parseInt(digits.charAt(i)) * weights1[i];
  }
  let remainder = sum % 11;
  let checkDigit = remainder < 2 ? 0 : 11 - remainder;
  if (parseInt(digits.charAt(12)) !== checkDigit) return false;
  
  // Validate second check digit
  const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  sum = 0;
  for (let i = 0; i < 13; i++) {
    sum += parseInt(digits.charAt(i)) * weights2[i];
  }
  remainder = sum % 11;
  checkDigit = remainder < 2 ? 0 : 11 - remainder;
  if (parseInt(digits.charAt(13)) !== checkDigit) return false;
  
  return true;
}

/**
 * Validate email format
 */
export function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/**
 * Validate date DD/MM/YYYY
 */
export function validateDate(dateStr) {
  const match = dateStr.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!match) return false;
  
  const [, day, month, year] = match;
  const d = parseInt(day);
  const m = parseInt(month);
  const y = parseInt(year);
  
  if (m < 1 || m > 12) return false;
  if (d < 1 || d > 31) return false;
  if (y < 1900 || y > 2100) return false;
  
  const date = new Date(y, m - 1, d);
  return date.getFullYear() === y && date.getMonth() === m - 1 && date.getDate() === d;
}

/**
 * Check if a string is CPF or CNPJ
 */
export function isCPF(value) {
  const digits = value.replace(/\D/g, '');
  return digits.length <= 11;
}

/**
 * Generate a random password
 */
export function generatePassword(length = 12) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%';
  let password = '';
  for (let i = 0; i < length; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

/**
 * Format file size to human readable
 */
export function formatFileSize(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

/**
 * Get today's date in DD/MM/YYYY format
 */
export function getTodayFormatted() {
  const today = new Date();
  const dd = String(today.getDate()).padStart(2, '0');
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const yyyy = today.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}
