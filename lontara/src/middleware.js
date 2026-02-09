import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

export function middleware(request) {
  // Only apply to API routes that need authentication
  const protectedPaths = ['/api/auth/me', '/api/admin', '/api/user/emails'];
  const path = request.nextUrl.pathname;
  
  const isProtected = protectedPaths.some(p => path.startsWith(p));
  
  if (!isProtected) {
    return NextResponse.next();
  }

  const authHeader = request.headers.get('authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json(
      { message: 'Unauthorized: No token provided' },
      { status: 401 }
    );
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    
    // Add user info to headers so it can be accessed in API routes
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-user-id', decoded.sub);
    requestHeaders.set('x-user-username', decoded.username);
    requestHeaders.set('x-user-role', decoded.role);

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { message: 'Unauthorized: Invalid token' },
      { status: 401 }
    );
  }
}

export const config = {
  matcher: '/api/:path*',
};
