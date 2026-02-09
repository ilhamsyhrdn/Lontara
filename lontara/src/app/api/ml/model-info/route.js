import { NextResponse } from 'next/server';

const classifier = require('@/../backend/src/services/machine-learning/classifier.service');

export async function GET() {
  try {
    const info = classifier.getModelInfo();

    return NextResponse.json({
      success: true,
      data: info,
    });
  } catch (error) {
    console.error('Model info error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to get model info',
        error: error.message,
      },
      { status: 500 }
    );
  }
}
