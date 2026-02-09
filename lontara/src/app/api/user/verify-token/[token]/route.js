import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function GET(request, { params }) {
  try {
    const { token } = params;

    const user = await prisma.authUser.findFirst({
      where: {
        activationToken: token,
        activationTokenExpires: { gte: new Date() }
      }
    });

    if (!user) {
      return NextResponse.json(
        { 
          valid: false,
          message: 'Invalid or expired activation token' 
        },
        { status: 400 }
      );
    }

    return NextResponse.json({ 
      valid: true,
      username: user.username,
      email: user.email,
      userId: user.id
    });
    
  } catch (error) {
    console.error('Verify token error:', error);
    return NextResponse.json(
      { message: 'Server error', error: error.message },
      { status: 500 }
    );
  }
}
