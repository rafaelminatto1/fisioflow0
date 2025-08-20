# FisioFlow Railway Deployment Guide

This guide provides step-by-step instructions for deploying the FisioFlow Next.js application to Railway.

## Prerequisites

1. Railway account (sign up at [railway.app](https://railway.app))
2. GitHub repository with your FisioFlow code
3. Railway CLI installed (optional, for local management)

## Railway Services Setup

### 1. Create a New Project

1. Go to [railway.app](https://railway.app) and create a new project
2. Choose "Deploy from GitHub repo" and select your FisioFlow repository
3. Railway will automatically detect it's a Next.js application

### 2. Add PostgreSQL Database

1. In your Railway project dashboard, click "New Service"
2. Select "Database" → "PostgreSQL"
3. Railway will automatically provision a PostgreSQL database
4. The `DATABASE_URL` environment variable will be automatically set

## Environment Variables

Set the following environment variables in Railway:

### Required Variables
```bash
# Database (automatically set by Railway)
DATABASE_URL=postgresql://... (auto-generated)
DIRECT_URL=postgresql://... (same as DATABASE_URL)

# NextAuth.js
NEXTAUTH_URL=https://your-app-name.railway.app
NEXTAUTH_SECRET=your-secret-key-minimum-32-characters

# Production optimizations
NODE_ENV=production
NEXT_TELEMETRY_DISABLED=1
```

### Optional Variables
```bash
# OAuth Providers
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Communication
TWILIO_ACCOUNT_SID=your-twilio-sid
TWILIO_AUTH_TOKEN=your-twilio-token
TWILIO_WHATSAPP_FROM=your-whatsapp-number

# External APIs
YOUTUBE_API_KEY=your-youtube-api-key
GOOGLE_DRIVE_API_KEY=your-drive-api-key

# Encryption
ENCRYPTION_KEY=your-32-character-encryption-key
```

## Deployment Process

### Automatic Deployment

1. Push your code to the connected GitHub repository
2. Railway will automatically:
   - Install dependencies with `pnpm install --frozen-lockfile`
   - Generate Prisma client with `pnpm prisma generate`
   - Build the application with `pnpm build`
   - Deploy the application

### Manual Deployment (using Railway CLI)

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login to Railway
railway login

# Link your project
railway link

# Deploy
railway up
```

## Database Migration

Railway will automatically run database migrations during deployment using the optimized scripts:

```bash
# This runs automatically during build
prisma generate && prisma migrate deploy && next build
```

### Manual Migration (if needed)

```bash
# Using Railway CLI
railway run prisma migrate deploy

# Or using the web terminal in Railway dashboard
```

## Performance Optimizations

The following optimizations are automatically applied for Railway:

### 1. Build Optimizations
- Standalone output for faster startup
- Optimized package imports
- Bundle splitting for better caching
- SWC minification enabled

### 2. Database Optimizations
- Connection pooling optimized for Railway
- Reduced query timeouts
- Proper connection cleanup
- Binary targets for Railway's Linux environment

### 3. Memory Optimizations
- Deterministic module IDs
- Minimized bundle size
- Optimized webpack configuration
- Reduced logging in production

## Health Monitoring

The application includes a health check endpoint:

```
GET https://your-app-name.railway.app/api/health
```

Response:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "database": "connected",
  "environment": "production",
  "railway": "deployed",
  "version": "1.0.0"
}
```

## Troubleshooting

### Common Issues

#### 1. Build Failures
- Ensure all required environment variables are set
- Check that Prisma schema is valid
- Verify pnpm-lock.yaml is committed to repository

#### 2. Database Connection Issues
- Verify `DATABASE_URL` is set correctly
- Check if database service is running
- Ensure network policies allow connections

#### 3. Memory Issues
- Railway provides 512MB RAM by default
- Monitor memory usage in Railway dashboard
- Consider upgrading plan if needed

#### 4. Environment Variables
- Use Railway dashboard to set variables
- Restart deployment after changing variables
- Check variable names match exactly

### Logs and Monitoring

Access logs through:
1. Railway dashboard → Your service → Deployments → View logs
2. Railway CLI: `railway logs`

### Performance Monitoring

Monitor your application:
1. Railway dashboard shows CPU, memory, and network usage
2. Use the health endpoint for application status
3. Monitor database performance in the PostgreSQL service

## Custom Domain (Optional)

1. Go to your service settings in Railway
2. Click "Custom Domain"
3. Add your domain and configure DNS
4. Update `NEXTAUTH_URL` environment variable

## Scaling

Railway automatically handles:
- Load balancing
- Auto-scaling based on traffic
- Zero-downtime deployments

For high-traffic applications, consider:
- Upgrading to a higher tier plan
- Implementing Redis for session storage
- Using CDN for static assets

## Security

The deployment includes:
- HTTPS automatically enabled
- Security headers configured
- Environment variables encrypted
- Database connections secured

## Support

For issues specific to Railway deployment:
1. Check Railway documentation
2. Contact Railway support
3. Review Railway community Discord

For FisioFlow application issues:
1. Check application logs
2. Review health endpoint status
3. Verify database connectivity