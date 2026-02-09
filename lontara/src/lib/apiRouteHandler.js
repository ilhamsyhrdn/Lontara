import { NextResponse } from 'next/server';

// Import backend routes
const adminRoutes = require('@/../backend/src/routes/admin.routes');
const adminOAuthRoutes = require('@/../backend/src/routes/admin.oauth.routes');
const userActivationRoutes = require('@/../backend/src/routes/user.activation.routes');
const userGmailOAuthRoutes = require('@/../backend/src/routes/user.gmail.oauth.routes');
const userEmailRoutes = require('@/../backend/src/routes/user.email.routes');
const mlRoutes = require('@/../backend/src/routes/ml.classification.routes');

/**
 * Helper to create Express-like request/response for API routes
 */
async function handleExpressRoute(request, context, router) {
  try {
    const url = new URL(request.url);
    const method = request.method;
    
    // Parse body for non-GET requests
    let body = {};
    if (method !== 'GET' && method !== 'HEAD') {
      try {
        body = await request.json();
      } catch (e) {
        // No body or invalid JSON
      }
    }

    // Create Express-like req object
    const req = {
      method,
      url: url.pathname,
      path: url.pathname,
      query: Object.fromEntries(url.searchParams),
      params: context.params || {},
      body,
      headers: Object.fromEntries(request.headers),
      get: function(header) {
        return this.headers[header.toLowerCase()];
      },
      // User info from middleware
      user: {
        sub: request.headers.get('x-user-id'),
        username: request.headers.get('x-user-username'),
        role: request.headers.get('x-user-role'),
      }
    };

    // Create Express-like res object
    let responseData = null;
    let statusCode = 200;
    let responseHeaders = {};

    const res = {
      statusCode: 200,
      status: function(code) {
        statusCode = code;
        this.statusCode = code;
        return this;
      },
      json: function(data) {
        responseData = data;
        return this;
      },
      send: function(data) {
        responseData = data;
        return this;
      },
      setHeader: function(key, value) {
        responseHeaders[key] = value;
        return this;
      },
      end: function() {
        return this;
      }
    };

    // Find matching route and execute
    await new Promise((resolve, reject) => {
      const layer = router.stack?.find(l => {
        if (!l.route) return false;
        const pathMatch = l.regexp.test(url.pathname);
        const methodMatch = l.route.methods[method.toLowerCase()];
        return pathMatch && methodMatch;
      });

      if (!layer) {
        statusCode = 404;
        responseData = { message: 'Route not found' };
        resolve();
        return;
      }

      // Execute route handlers
      const handlers = layer.route.stack.map(s => s.handle);
      let idx = 0;

      function next(err) {
        if (err) {
          reject(err);
          return;
        }
        if (idx >= handlers.length) {
          resolve();
          return;
        }
        const handler = handlers[idx++];
        try {
          handler(req, res, next);
        } catch (e) {
          reject(e);
        }
      }

      next();
    });

    return NextResponse.json(responseData || { message: 'No response data' }, {
      status: statusCode,
      headers: responseHeaders
    });

  } catch (error) {
    console.error('API Route Error:', error);
    return NextResponse.json(
      { message: 'Internal server error', error: error.message },
      { status: 500 }
    );
  }
}

// Export route configurations
export const routes = {
  admin: adminRoutes,
  adminOAuth: adminOAuthRoutes,
  userActivation: userActivationRoutes,
  userGmailOAuth: userGmailOAuthRoutes,
  userEmail: userEmailRoutes,
  ml: mlRoutes,
};

export { handleExpressRoute };
