import { NextResponse, type NextRequest } from 'next/server';

// Locale selection only. Never use middleware as the authorization boundary.
export function middleware(request: NextRequest) {
  return NextResponse.redirect(new URL('/ar', request.url));
}

export const config = { matcher: ['/'] };
