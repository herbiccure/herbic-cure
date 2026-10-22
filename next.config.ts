import type { NextConfig } from "next";

const securityHeaders = [
  {
    key: "X-DNS-Prefetch-Control",
    value: "on",
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=31536000; includeSubDomains; preload",
  },
  {
    key: "X-Frame-Options",
    value: "SAMEORIGIN",
  },
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-eval' 'unsafe-inline' https:",
      "style-src 'self' 'unsafe-inline' https:",
      "img-src 'self' blob: data: https:",
      "font-src 'self' data: https:",
      "media-src 'self' blob: data: https: http:",
      "frame-src 'self' blob: https://drive.google.com https://*.google.com https://docs.google.com https://*.googleusercontent.com https://www.instagram.com https://*.instagram.com https://*.cdninstagram.com https://www.youtube.com https://www.youtube-nocookie.com https://player.vimeo.com https://*.delhivery.com https://*.razorpay.com https://api.razorpay.com https://checkout.razorpay.com",
      "child-src 'self' blob: https://drive.google.com https://*.google.com https://docs.google.com https://*.googleusercontent.com https://www.instagram.com https://*.instagram.com https://*.cdninstagram.com https://www.youtube.com https://www.youtube-nocookie.com https://player.vimeo.com",
      "connect-src 'self' https: ws: wss: https://api.razorpay.com https://lumberjack.razorpay.com",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join("; "),
  },
];

const nextConfig: NextConfig = {
  compress: true,
  /* Allow access and HMR websocket connections from local network devices (e.g. mobile testing) */
  allowedDevOrigins: [
    '192.168.1.9',
    '192.168.1.9:3000',
    '192.168.1.*',
    'localhost',
    'localhost:3000',
    '127.0.0.1',
    '127.0.0.1:3000',
  ],
  experimental: {
    optimizePackageImports: [
      'lucide-react',
      'sonner',
      'better-auth',
      'react-player',
      '@prisma/client',
      'date-fns',
    ],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
      {
        source: "/images/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=86400, stale-while-revalidate=604800",
          },
        ],
      },
    ];
  },
  images: {
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 31536000,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
      {
        protocol: 'http',
        hostname: '**',
      },
    ],
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
