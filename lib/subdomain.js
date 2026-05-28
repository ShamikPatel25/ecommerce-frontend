/**
 * Subdomain utilities for local multi-tenant development.
 *
 * How it works:
 *   - Each store runs on {subdomain}.localhost:3000
 *   - The Next.js middleware extracts the subdomain and sets a cookie
 *   - The API client reads the cookie and sends X-Tenant header to Django
 *   - Django TenantMiddleware resolves the store by subdomain name
 */

/**
 * Extract subdomain from a hostname.
 * @param {string} host - e.g. "nike.localhost:3000" or "nike.myplatform.com"
 * @returns {string|null} subdomain or null
 */
export function getSubdomain(host) {
  // Remove port
  const hostname = host.split(':')[0];

  // "nike.localhost" → subdomain = "nike"
  if (hostname.endsWith('.localhost')) {
    const sub = hostname.replace('.localhost', '');
    return sub || null;
  }

  // "localhost" or "127.0.0.1" → no subdomain
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return null;
  }

  // Production: "nike.myplatform.com" → "nike"
  const parts = hostname.split('.');
  if (parts.length >= 3) {
    return parts[0];
  }

  return null;
}
