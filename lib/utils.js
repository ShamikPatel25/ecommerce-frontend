import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

const CURRENCY_MAP = {
  INR: { symbol: '₹', locale: 'en-IN' },
  USD: { symbol: '$', locale: 'en-US' },
  EUR: { symbol: '€', locale: 'en-IE' },
  GBP: { symbol: '£', locale: 'en-GB' },
};

/**
 * Format a number as currency. Falls back to ₹ (INR) if currency is unknown.
 * @param {number|string} amount
 * @param {string} [currency='INR']
 * @returns {string} e.g. "₹1,499.00"
 */
export function formatCurrency(amount, currency = 'INR') {
  const num = Number.parseFloat(amount) || 0;
  const { symbol, locale } = CURRENCY_MAP[currency] || CURRENCY_MAP.INR;
  return `${symbol}${num.toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/**
 * Format a large number compactly (e.g. 1.5k, 2L, 5Cr)
 * @param {number|string} amount 
 * @param {string} [currency='INR'] 
 * @param {number} [fractionDigits=1]
 * @returns {string} e.g. "1.5L"
 */
export function formatCompactNumber(amount, currency = 'INR', fractionDigits = 1) {
  const num = Number.parseFloat(amount) || 0;
  const format = (val, suffix) => {
    const str = val.toFixed(fractionDigits);
    return (str.endsWith('.0') ? str.slice(0, -2) : str) + suffix;
  };

  if (currency === 'INR') {
    if (num >= 10000000) return format(num / 10000000, 'Cr');
    if (num >= 100000) return format(num / 100000, 'L');
    if (num >= 1000) return format(num / 1000, 'k');
    return num.toString();
  } else {
    if (num >= 1000000000) return format(num / 1000000000, 'B');
    if (num >= 1000000) return format(num / 1000000, 'M');
    if (num >= 1000) return format(num / 1000, 'k');
    return num.toString();
  }
}

export function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });
}

export function formatDateTime(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: 'numeric', minute: '2-digit',
  });
}

export function calcDiscountPercent(price, compareAtPrice) {
  if (!compareAtPrice || Number.parseFloat(compareAtPrice) <= Number.parseFloat(price)) return 0;
  return Math.round((1 - Number.parseFloat(price) / Number.parseFloat(compareAtPrice)) * 100);
}