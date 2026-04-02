import { NextResponse } from 'next/server';

/**
 * Next.js proxy — handles two things:
 * 1. Subdomain detection → sets x-tenant cookie
 * 2. Routing split: subdomain = storefront, no subdomain = admin
 */
export function proxy(request) {
  const host = request.headers.get('host') || '';
  const hostname = host.split(':')[0];
  const { pathname } = request.nextUrl;

  let subdomain = '';

  if (hostname.endsWith('.localhost')) {
    subdomain = hostname.replace('.localhost', '');
  } else if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
    const parts = hostname.split('.');
    if (parts.length >= 3) {
      subdomain = parts[0];
    }
  }

  // ─── ROUTING SPLIT ──────────────────────────────────────────────────
  if (subdomain) {
    // On a subdomain → storefront experience
    // Admin paths should redirect to base domain
    const adminPaths = [
      '/dashboard', '/orders', '/catalogs', '/customers',
      '/stores', '/settings', '/categories', '/attributes',
      '/login', '/register', '/forgot-password', '/reset-password',
    ];
    const isAdminPath = adminPaths.some(p => pathname === p || pathname.startsWith(p + '/'));

    if (isAdminPath) {
      const url = request.nextUrl.clone();
      url.hostname = 'localhost';
      url.port = request.nextUrl.port || '3000';
      url.host = `localhost:${url.port}`;
      return NextResponse.redirect(url);
    }

    // Storefront paths → rewrite to internal /storefront/... routes
    const storefrontPaths = ['/', '/products', '/cart', '/checkout', '/order-confirmation'];
    const isStorefrontPath =
      storefrontPaths.includes(pathname) ||
      pathname.startsWith('/products/') ||
      pathname.startsWith('/cart') ||
      pathname.startsWith('/checkout') ||
      pathname.startsWith('/order-confirmation');

    if (isStorefrontPath) {
      const url = request.nextUrl.clone();
      url.pathname = '/storefront' + (pathname === '/' ? '' : pathname);
      const response = NextResponse.rewrite(url);
      response.cookies.set('x-tenant', subdomain, {
        path: '/',
        httpOnly: false,
        sameSite: 'lax',
      });
      return response;
    }

    // For any other path, just set the cookie and pass through
    const response = NextResponse.next();
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
