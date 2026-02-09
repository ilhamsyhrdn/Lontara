import { NextResponse } from 'next/server';

/**
 * Helper function to get user from request headers
 * (Set by middleware after JWT verification)
 */
export function getUserFromHeaders(request) {
  const userId = request.headers.get('x-user-id');
  const username = request.headers.get('x-user-username');
  const role = request.headers.get('x-user-role');

  if (!userId) {
    return null;
  }

  return {
    id: userId,
    sub: userId,
    username,
    role,
  };
}

/**
 * Helper function to check if user is admin
 */
export function isAdmin(request) {
  const role = request.headers.get('x-user-role');
  return role === 'ADMIN';
}

/**
 * Helper function to create error response
 */
export function errorResponse(message, status = 500, error = null) {
  const body = { message };
  if (error) {
    body.error = error.message || error;
  }
  return NextResponse.json(body, { status });
}

/**
 * Helper function to create success response
 */
export function successResponse(data, status = 200) {
  return NextResponse.json(data, { status });
}

/**
 * Wrapper for API route handlers with error handling
 */
export function withErrorHandler(handler) {
  return async (request, context) => {
    try {
      return await handler(request, context);
    } catch (error) {
      console.error('API Route Error:', error);
      return errorResponse('Internal server error', 500, error);
    }
  };
}

/**
 * Wrapper to require authentication
 */
export function requireAuth(handler) {
  return withErrorHandler(async (request, context) => {
    const user = getUserFromHeaders(request);
    
    if (!user) {
      return errorResponse('Unauthorized', 401);
    }
    
    return handler(request, context, user);
  });
}

/**
 * Wrapper to require admin role
 */
export function requireAdmin(handler) {
  return requireAuth(async (request, context, user) => {
    if (user.role !== 'ADMIN') {
      return errorResponse('Forbidden: Admin access required', 403);
    }
    
    return handler(request, context, user);
  });
}

/**
 * Parse JSON body safely
 */
export async function parseBody(request) {
  try {
    return await request.json();
  } catch (error) {
    return null;
  }
}

/**
 * Get query parameters from URL
 */
export function getQueryParams(request) {
  const url = new URL(request.url);
  return Object.fromEntries(url.searchParams);
}
