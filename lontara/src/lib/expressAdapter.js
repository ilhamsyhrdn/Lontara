import { NextResponse } from 'next/server';

/**
 * Adapter untuk menjalankan Express Router di Next.js API Routes
 */
export function createExpressAdapter(expressRouter) {
  return async function handler(request, context) {
    try {
      // Create mock req and res objects
      const req = {
        method: request.method,
        url: request.url,
        headers: Object.fromEntries(request.headers),
        body: request.method !== 'GET' && request.method !== 'HEAD' 
          ? await request.json().catch(() => ({}))
          : {},
        query: Object.fromEntries(new URL(request.url).searchParams),
        params: context.params || {},
        user: null, // Will be set by auth middleware
      };

      let responseData = null;
      let statusCode = 200;
      let responseHeaders = {};

      const res = {
        status: (code) => {
          statusCode = code;
          return res;
        },
        json: (data) => {
          responseData = data;
          return res;
        },
        send: (data) => {
          responseData = data;
          return res;
        },
        setHeader: (key, value) => {
          responseHeaders[key] = value;
          return res;
        },
      };

      // Execute the Express router
      await new Promise((resolve, reject) => {
        expressRouter(req, res, (err) => {
          if (err) reject(err);
          else resolve();
        });
      });

      return NextResponse.json(responseData, { 
        status: statusCode,
        headers: responseHeaders 
      });
    } catch (error) {
      console.error('Express adapter error:', error);
      return NextResponse.json(
        { message: 'Internal server error', error: error.message },
        { status: 500 }
      );
    }
  };
}
