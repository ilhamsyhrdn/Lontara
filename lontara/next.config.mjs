/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable server-side rendering
  reactStrictMode: true,
  
  // Webpack configuration for backend modules
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Add backend directory to module resolution
      config.resolve.alias['@backend'] = require('path').resolve(__dirname, 'backend/src');
    }
    
    // Handle .node files for TensorFlow - ignore warnings
    config.ignoreWarnings = [
      { module: /node_modules\/@tensorflow\/tfjs-node/ },
    ];

    return config;
  },

  // Output configuration for Vercel
  output: 'standalone',

  // Environment variables to expose to the browser
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || '',
    NEXT_PUBLIC_FRONTEND_URL: process.env.NEXT_PUBLIC_FRONTEND_URL || '',
  },

  // Experimental features
  experimental: {
    serverComponentsExternalPackages: [
      '@tensorflow/tfjs-node',
      'nodemailer',
      'pdf-parse',
    ],
  },
};

export default nextConfig;
