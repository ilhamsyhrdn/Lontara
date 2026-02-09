import { NextResponse } from 'next/server';

// DEMO MODE - Hardcoded admin user
const DEMO_USER = {
  id: 'demo-admin-001',
  username: 'admin',
  email: 'admin@lontara.com',
  role: 'ADMIN',
  isEmailVerified: true,
  createdAt: new Date().toISOString()
};

export async function GET(request) {
  try {
    const userId = request.headers.get('x-user-id');
    
    if (!userId) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Demo mode - return hardcoded user
    return NextResponse.json(DEMO_USER);
  } catch (error) {
    console.error('Get user error:', error);
    return NextResponse.json(
      { message: 'Server error', error: error.message },
      { status: 500 }
    );
  }
}
