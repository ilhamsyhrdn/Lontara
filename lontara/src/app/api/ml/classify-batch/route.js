import { NextResponse } from 'next/server';

const classifier = require('@/../backend/src/services/machine-learning/classifier.service');

export async function POST(request) {
  try {
    const { emails } = await request.json();

    if (!emails || !Array.isArray(emails)) {
      return NextResponse.json(
        {
          success: false,
          message: 'Emails array is required',
        },
        { status: 400 }
      );
    }

    const results = await classifier.classifyBatch(emails);

    return NextResponse.json({
      success: true,
      data: results,
    });
  } catch (error) {
    console.error('Batch classification error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to classify emails',
        error: error.message,
      },
      { status: 500 }
    );
  }
}
