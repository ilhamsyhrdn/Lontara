import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export async function POST(request) {
  try {
    const { token, password } = await request.json();

    if (!token || !password) {
      return NextResponse.json(
        { message: 'Token and password required' },
        { status: 400 }
      );
    }

    // Validate password strength
    if (password.length < 8) {
      return NextResponse.json(
        { message: 'Password must be at least 8 characters' },
        { status: 400 }
      );
    }

    const user = await prisma.authUser.findFirst({
      where: {
        activationToken: token,
        activationTokenExpires: { gte: new Date() }
      }
    });

    if (!user) {
      return NextResponse.json(
        { message: 'Invalid or expired activation token' },
        { status: 400 }
      );
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Update user
    await prisma.authUser.update({
      where: { id: user.id },
      data: {
        passwordHash,
        isEmailVerified: true,
        activationToken: null,
        activationTokenExpires: null,
      }
    });

    // Generate JWT token for auto-login
    const jwtToken = jwt.sign(
      { sub: user.id, username: user.username, role: user.role },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '8h' }
    );

    return NextResponse.json({
      message: 'Account activated successfully',
      token: jwtToken,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    });

  } catch (error) {
    console.error('Activate account error:', error);
    return NextResponse.json(
      { message: 'Server error', error: error.message },
      { status: 500 }
    );
  }
}
