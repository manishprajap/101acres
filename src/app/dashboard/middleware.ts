// middleware.ts
import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  const token = await getToken({ req });
  const { pathname } = req.nextUrl;

  // Allow next-auth, public files, landing page
  if (
    pathname.startsWith('/api/auth') ||
    pathname.startsWith('/landing') ||
    pathname === '/' ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  if (!token) {
    return NextResponse.redirect(new URL('/landing', req.url));
  }

  // Role-based redirection
  if (pathname === '/dashboard') {
    if (token.role === 'admin') {
      return NextResponse.redirect(new URL('/dashboard/admin', req.url));
    } else if (token.role === 'agent') {
      return NextResponse.redirect(new URL('/dashboard/agent', req.url));
    } else {
      return NextResponse.redirect(new URL('/dashboard/user', req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*'],
};