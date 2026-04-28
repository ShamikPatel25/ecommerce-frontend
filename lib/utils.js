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