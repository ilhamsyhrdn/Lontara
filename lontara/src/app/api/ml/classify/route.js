import { NextResponse } from 'next/server';

// Import classifier service
const classifier = require('@/../backend/src/services/machine-learning/classifier.service');

export async function POST(request) {
  try {
    const { subject, body, attachments } = await request.json();

    if (!subject && !body) {
      return NextResponse.json(
        {
          success: false,
          message: 'Subject or body is required',
        },
        { status: 400 }
      );
    }

    const emailData = {
      subject: subject || '',
      body: body || '',
      attachments: attachments || [],
    };

    const result = await classifier.classify(emailData);

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Classification error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to classify email',
        error: error.message,
      },
      { status: 500 }
    );
  }
}
