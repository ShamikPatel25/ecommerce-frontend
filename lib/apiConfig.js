export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || (
  process.env.NODE_ENV === 'production' && typeof window !== 'undefined'
    ? (() => { throw new Error('NEXT_PUBLIC_API_URL is required in production'); })()
    : 'http://localhost:8000/api'
);
