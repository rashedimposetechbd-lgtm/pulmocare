/**
 * Bangla & English Number and Currency Formatters
 */

const BANGLA_DIGITS = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];

export function toBanglaNumber(n) {
  if (n === null || n === undefined) return '';
  return String(n).replace(/[0-9]/g, (d) => BANGLA_DIGITS[Number(d)] || d);
}

export function formatTaka(n, useBanglaDigits = false) {
  const num = typeof n === 'number' ? n : Number(n) || 0;
  const formatted = num.toLocaleString('en-US');
  if (useBanglaDigits) {
    return `৳ ${toBanglaNumber(formatted)}`;
  }
  return `৳ ${formatted}`;
}

export function formatDate(dateInput) {
  if (!dateInput) return '';
  let d;
  if (dateInput.toDate && typeof dateInput.toDate === 'function') {
    d = dateInput.toDate();
  } else if (dateInput instanceof Date) {
    d = dateInput;
  } else {
    d = new Date(dateInput);
  }
  if (isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}
