import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth, errorResponse, successResponse } from '@/lib/apiHelpers';

export const GET = requireAuth(async (request, context, user) => {
  try {
    const userData = await prisma.authUser.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!userData) {
      return errorResponse('User not found', 404);
    }

    return successResponse(userData);
  } catch (error) {
    console.error('Get user error:', error);
    return errorResponse('Server error', 500, error);
  }
});
