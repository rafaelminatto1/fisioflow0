import type { NextConfig } from "next";

const isProduction = process.env.NODE_ENV === 'production';
const isRailway = process.env.RAILWAY_ENVIRONMENT_NAME !== undefined;

const nextConfig: NextConfig = {
  // Railway-specific optimizations
  output: isRailway ? 'standalone' : undefined,
  
  experimental: {
    serverActions: {
      allowedOrigins: [
        "localhost:3000", 
        "*.railway.app", 
        "*.vercel.app",
        ...(process.env.NEXTAUTH_URL ? [new URL(process.env.NEXTAUTH_URL).hostname] : [])
      ],
    },
    optimizePackageImports: [
      'lucide-react', 
      '@radix-ui/react-icons', 
      '@prisma/client',
      '@auth/prisma-adapter',
      'recharts',
      'date-fns'
    ],
    serverMinification: true,
    optimizeCss: isProduction,
    webVitalsAttribution: ['CLS', 'LCP'],
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'youtube.com',
      },
      {
        protocol: 'https',
        hostname: 'img.youtube.com',
      },
      {
        protocol: 'https',
        hostname: '*.googleapis.com',
      }
    ],
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 60
  },
  env: {
    DATABASE_URL: process.env.DATABASE_URL,
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
    RAILWAY_ENVIRONMENT_NAME: process.env.RAILWAY_ENVIRONMENT_NAME,
  },
  
  // Performance optimizations
  compress: true,
  poweredByHeader: false,
  generateEtags: true,
  trailingSlash: false,
  
  // Railway-specific optimizations
  ...(isRailway && {
    swcMinify: true,
    compiler: {
      removeConsole: isProduction ? { exclude: ['error', 'warn'] } : false,
    },
  }),
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          }
        ],
      },
    ]
  },
  webpack: (config, { dev, isServer }) => {
    // Production and Railway optimizations
    if (!dev) {
      if (!isServer) {
        // Client-side optimizations
        config.optimization = {
          ...config.optimization,
          splitChunks: {
            ...config.optimization.splitChunks,
            chunks: 'all',
            cacheGroups: {
              ...config.optimization.splitChunks.cacheGroups,
              vendor: {
                test: /[\\/]node_modules[\\/]/,
                name: 'vendors',
                chunks: 'all',
                enforce: true,
              },
              prisma: {
                test: /[\\/]node_modules[\\/]@prisma[\\/]/,
                name: 'prisma',
                chunks: 'all',
                enforce: true,
              },
              common: {
                name: 'common',
                minChunks: 2,
                chunks: 'all',
                enforce: true,
              },
            },
          },
        };
      }
      
      // Railway-specific optimizations
      if (isRailway) {
        // Reduce bundle size for Railway
        config.resolve.alias = {
          ...config.resolve.alias,
          '@prisma/client': '@prisma/client',
        };
        
        // Optimize for Railway's memory constraints
        config.optimization.moduleIds = 'deterministic';
        config.optimization.minimize = true;
      }
    }
    
    return config;
  }
};

export default nextConfig;
