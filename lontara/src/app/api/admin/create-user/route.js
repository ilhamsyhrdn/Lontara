import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import crypto from 'crypto';
import { requireAdmin, parseBody, errorResponse, successResponse } from '@/lib/apiHelpers';

const sendMail = require('@/../backend/src/config/mailer');

export const POST = requireAdmin(async (request, context, user) => {
  try {
    const body = await parseBody(request);
    const { username, email, role } = body;

    if (!username || !email) {
      return errorResponse('Username & email required', 400);
    }

    // Check if username/email already exists
    const existing = await prisma.authUser.findFirst({
      where: { OR: [{ username }, { email }] }
    });
    
    if (existing) {
      return errorResponse('Username or email already exists', 400);
    }

    // Generate activation token (valid for 24 hours)
    const activationToken = crypto.randomBytes(32).toString('hex');
    const tokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    // Create user WITHOUT password (will be set during activation)
    const newUser = await prisma.authUser.create({
      data: {
        username,
        email,
        role: role || 'STAFF',
        isEmailVerified: false,
        mustChangePassword: false,
        activationToken,
        activationTokenExpires: tokenExpires
      }
    });

    // Send activation email
    const baseUrl = process.env.NEXT_PUBLIC_FRONTEND_URL || 'http://localhost:3000';
    const activationUrl = `${baseUrl}/activate/${activationToken}`;
    
    await sendMail({
      to: email,
      subject: 'Aktivasi Akun Lontara Mail',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Selamat Datang di Lontara Mail! 🎉</h2>
          <p>Halo <b>${username}</b>,</p>
          <p>Akun Anda telah dibuat oleh administrator. Untuk mengaktifkan akun Anda, silakan klik tombol di bawah ini:</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${activationUrl}" 
               style="background-color: #4F46E5; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
              Aktivasi Akun
            </a>
          </div>
          
          <p>Atau copy link berikut ke browser Anda:</p>
          <p style="background-color: #f5f5f5; padding: 10px; word-break: break-all;">
            ${activationUrl}
          </p>
          
          <p><b>Username Anda:</b> ${username}</p>
          <p><b>Role:</b> ${role || 'STAFF'}</p>
          
          <p style="color: #666; font-size: 14px;">
            Link aktivasi ini berlaku selama 24 jam.<br>
            Setelah aktivasi, Anda akan diminta untuk membuat password.
          </p>
          
          <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
          <p style="color: #999; font-size: 12px;">
            Email ini dikirim secara otomatis. Jika Anda tidak merasa mendaftar, abaikan email ini.
          </p>
        </div>
      `
    });

    return successResponse({ 
      message: 'User created & activation email sent', 
      userId: newUser.id,
      username: newUser.username,
      email: newUser.email
    });
    
  } catch (error) {
    console.error('Create user error:', error);
    return errorResponse('Server error', 500, error);
  }
});
