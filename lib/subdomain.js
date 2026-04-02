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

/**
 * Build the URL for a store's subdomain.
 * @param {string} subdomain
 * @returns {string} e.g. "http://nike.localhost:3000"
 */
export function getStoreUrl(subdomain) {
  if (typeof window === 'undefined') return `http://${subdomain}.localhost:3000`;

  const { protocol, port } = window.location;
  const hostname = window.location.hostname;

  // Already on a subdomain of localhost (e.g., old.localhost)
  // or on plain localhost
  if (hostname === 'localhost' || hostname.endsWith('.localhost')) {
    return `${protocol}//${subdomain}.localhost${port ? ':' + port : ''}`;
  }

  // Production: replace subdomain in current domain
  const parts = hostname.split('.');
  if (parts.length >= 3) {
    parts[0] = subdomain;
  } else {
    parts.unshift(subdomain);
  }
  return `${protocol}//${parts.join('.')}${port ? ':' + port : ''}`;
}

/**
 * Get the base (no-subdomain) URL. Used for auth pages.
 * @returns {string} e.g. "http://localhost:3000"
 */
export function getBaseUrl() {
  if (typeof window === 'undefined') return 'http://localhost:3000';

  const { protocol, port } = window.location;
  const hostname = window.location.hostname;

  if (hostname === 'localhost' || hostname.endsWith('.localhost')) {
    return `${protocol}//localhost${port ? ':' + port : ''}`;
  }

  // Production: remove subdomain
  const parts = hostname.split('.');
  if (parts.length >= 3) {
    return `${protocol}//${parts.slice(1).join('.')}${port ? ':' + port : ''}`;
  }
  return `${protocol}//${hostname}${port ? ':' + port : ''}`;
}
