import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

// DEMO MODE - Hardcoded admin user (no database needed)
const DEMO_USER = {
  id: 'demo-admin-001',
  username: 'admin',
  password: 'admin123',
  email: 'admin@lontara.com',
  role: 'ADMIN'
};

export async function POST(request) {
  try {
    const { username, password } = await request.json();
    
    if (!username || !password) {
      return NextResponse.json(
        { message: 'Missing username or password' },
        { status: 400 }
      );
    }

    // Demo login - hardcoded credentials
    if (username === DEMO_USER.username && password === DEMO_USER.password) {
      const token = jwt.sign(
        { sub: DEMO_USER.id, username: DEMO_USER.username, role: DEMO_USER.role },
        process.env.JWT_SECRET || 'demo-secret-key',
        { expiresIn: '8h' }
      );

      return NextResponse.json({
        token,
        user: { id: DEMO_USER.id, username: DEMO_USER.username, role: DEMO_USER.role },
      });
    }

    // Invalid credentials
    return NextResponse.json(
      { message: 'Invalid credentials' },
      { status: 401 }
    );
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { message: 'Server error', error: error.message },
      { status: 500 }
    );
  }
}
