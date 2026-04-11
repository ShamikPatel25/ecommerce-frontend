import { NextResponse } from 'next/server';

/**
 * Next.js proxy — handles two things:
 * 1. Subdomain detection → sets x-tenant cookie
 * 2. Routing split: subdomain = storefront, no subdomain = admin
 */
export function middleware(request) {
  const host = request.headers.get('host') || '';
  const hostname = host.split(':')[0];
  const { pathname } = request.nextUrl;

  const isIPAddress = /^(?:\d{1,3}\.){3}\d{1,3}$/.test(hostname);
  let subdomain = '';
  let baseHostname = hostname;

  // 1. Determine subdomain and base hostname
  if (hostname.endsWith('.localhost')) {
    subdomain = hostname.replace('.localhost', '');
    baseHostname = 'localhost';
  } else if (hostname.endsWith('.nip.io')) {
    const withoutNip = hostname.replace('.nip.io', '');
    const parts = withoutNip.split('.');
    if (parts.length > 4) {
      subdomain = parts.slice(0, parts.length - 4).join('.');
    }
    const ipString = parts.slice(-4).join('.');
    baseHostname = `${ipString}.nip.io`;
  } else if (!isIPAddress && hostname !== 'localhost' && hostname !== '127.0.0.1') {
    const parts = hostname.split('.');
    if (parts.length >= 3) {
      subdomain = parts[0];
      baseHostname = parts.slice(1).join('.');
    }
  }

  // Allow explicit query override for local IP testing
  if (request.nextUrl.searchParams.has('tenant')) {
    subdomain = request.nextUrl.searchParams.get('tenant');
  } 

  // ─── ROUTING SPLIT ──────────────────────────────────────────────────
  if (subdomain) {
    const adminPaths = [
      '/dashboard', '/orders', '/catalogs', '/customers',
      '/stores', '/settings', '/categories', '/attributes',
      '/login', '/register', '/forgot-password', '/reset-password',
    ];
    const isAdminPath = adminPaths.some(p => pathname === p || pathname.startsWith(p + '/'));

    // If Admin path is accessed on a Storefront subdomain, redirect to base domain
    if (isAdminPath) {
      const url = request.nextUrl.clone();
      url.hostname = baseHostname;
      url.port = request.nextUrl.port || '3000';
      url.host = `${url.hostname}${url.port ? ':' + url.port : ''}`;
      return NextResponse.redirect(url);
    }

    const storefrontPaths = ['/', '/products', '/cart', '/checkout', '/order-confirmation', '/account/login', '/account/orders'];
    const isStorefrontPath =
      storefrontPaths.includes(pathname) ||
      pathname.startsWith('/products/') ||
      pathname.startsWith('/cart') ||
      pathname.startsWith('/checkout') ||
      pathname.startsWith('/order-confirmation') ||
      pathname.startsWith('/account/');

    let response;
    if (isStorefrontPath) {
      const url = request.nextUrl.clone();
      url.pathname = '/storefront' + (pathname === '/' ? '' : pathname);
      const requestHeaders = new Headers(request.headers);
      requestHeaders.set('x-is-subdomain', '1');
      response = NextResponse.rewrite(url, { request: { headers: requestHeaders } });
    } else {
      const requestHeaders = new Headers(request.headers);
      requestHeaders.set('x-is-subdomain', '1');
      response = NextResponse.next({ request: { headers: requestHeaders } });
    }

    response.cookies.set('x-tenant', subdomain, {
      path: '/',
      httpOnly: false,
      sameSite: 'lax',
    });
    return response;
  }

  // No subdomain → admin panel (existing behavior)
  const response = NextResponse.next();
  response.cookies.delete('x-tenant');
  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|media).*)',
  ],
};
