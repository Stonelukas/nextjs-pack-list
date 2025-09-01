# Pack List - Production Deployment Guide

## Prerequisites

- Node.js 18.x or higher
- Bun package manager (or npm/yarn)
- Git

## Environment Setup

1. Copy the production environment variables:
```bash
cp .env.production .env.local
```

2. Update the following variables in `.env.local`:
- `NEXT_PUBLIC_APP_URL` - Your production domain
- `NEXT_PUBLIC_GA_ID` - Google Analytics ID (optional)
- `NEXT_PUBLIC_SENTRY_DSN` - Sentry error tracking (optional)

## Build Process

### Local Build

```bash
# Install dependencies
bun install

# Run production build
bun run build

# Test production build locally
PORT=3000 bun run start
```

### Docker Build

```dockerfile
# Dockerfile
FROM oven/bun:1 as base
WORKDIR /app

# Install dependencies
FROM base AS install
COPY package.json bun.lockb ./
RUN bun install --frozen-lockfile --production

# Build the application
FROM base AS builder
COPY --from=install /app/node_modules ./node_modules
COPY . .
RUN bun run build

# Production image
FROM base AS release
COPY --from=install /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./

USER bun
EXPOSE 3000
CMD ["bun", "run", "start"]
```

## Deployment Options

### 1. Vercel (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

### 2. Netlify

```bash
# Install Netlify CLI
npm i -g netlify-cli

# Deploy
netlify deploy --prod
```

### 3. Self-Hosted (VPS/Cloud)

```bash
# SSH into your server
ssh user@your-server.com

# Clone repository
git clone https://github.com/yourusername/pack-list.git
cd pack-list

# Install dependencies and build
bun install
bun run build

# Setup PM2 for process management
npm i -g pm2
pm2 start bun --name "pack-list" -- run start
pm2 save
pm2 startup
```

### 4. Docker Deployment

```bash
# Build Docker image
docker build -t pack-list .

# Run container
docker run -p 3000:3000 -d --name pack-list pack-list

# Using Docker Compose
docker-compose up -d
```

## Performance Optimizations

### CDN Configuration

1. **Static Assets**: Serve from CDN
```nginx
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

2. **Image Optimization**: Next.js automatically optimizes images

### Caching Strategy

- Static pages: Cache for 1 hour
- API routes: Cache for 5 minutes
- Assets: Cache for 1 year

### Security Headers

Add to `next.config.ts`:
```typescript
const securityHeaders = [
  {
    key: 'X-DNS-Prefetch-Control',
    value: 'on'
  },
  {
    key: 'X-XSS-Protection',
    value: '1; mode=block'
  },
  {
    key: 'X-Frame-Options',
    value: 'SAMEORIGIN'
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff'
  },
  {
    key: 'Referrer-Policy',
    value: 'origin-when-cross-origin'
  }
]
```

## Monitoring

### 1. Performance Monitoring

- Web Vitals are automatically tracked
- Check browser console for metrics in development
- In production, metrics are sent to analytics

### 2. Error Tracking

Configure Sentry (optional):
```bash
npm install @sentry/nextjs
npx @sentry/wizard -i nextjs
```

### 3. Uptime Monitoring

Recommended services:
- UptimeRobot
- Pingdom
- StatusCake

## Database (Future Enhancement)

Currently, Pack List uses local storage. For future database integration:

### PostgreSQL Setup
```sql
CREATE DATABASE packlist;
CREATE USER packlist_user WITH PASSWORD 'secure_password';
GRANT ALL PRIVILEGES ON DATABASE packlist TO packlist_user;
```

### Prisma Integration
```bash
npm install prisma @prisma/client
npx prisma init
```

## Backup Strategy

### Local Storage Backup
Users can export their lists as JSON files for backup.

### Future Database Backup
```bash
# PostgreSQL backup
pg_dump packlist > backup_$(date +%Y%m%d).sql

# Restore
psql packlist < backup_20240101.sql
```

## Rollback Procedure

### Vercel
```bash
vercel rollback
```

### Self-Hosted
```bash
# Keep previous build
mv .next .next.backup

# If issues occur, restore
rm -rf .next
mv .next.backup .next
pm2 restart pack-list
```

## Health Checks

### Endpoint Monitoring
- `/` - Homepage (should return 200)
- `/api/health` - Health check endpoint (to be implemented)

### Metrics to Monitor
- Response time < 200ms
- Error rate < 1%
- CPU usage < 80%
- Memory usage < 90%

## Troubleshooting

### Common Issues

1. **Port Already in Use**
```bash
# Find process using port 3000
lsof -i :3000
# Kill process
kill -9 <PID>
```

2. **Build Failures**
```bash
# Clear cache
rm -rf .next
rm -rf node_modules
bun install
bun run build
```

3. **Memory Issues**
```bash
# Increase Node memory
NODE_OPTIONS="--max-old-space-size=4096" bun run build
```

## Maintenance Mode

Create `maintenance.html`:
```html
<!DOCTYPE html>
<html>
<head>
    <title>Pack List - Maintenance</title>
</head>
<body>
    <h1>We'll be back soon!</h1>
    <p>Pack List is currently undergoing maintenance.</p>
</body>
</html>
```

Nginx configuration:
```nginx
location / {
    if (-f $document_root/maintenance.html) {
        return 503;
    }
    proxy_pass http://localhost:3000;
}

error_page 503 @maintenance;
location @maintenance {
    rewrite ^(.*)$ /maintenance.html break;
}
```

## Post-Deployment Checklist

- [ ] Verify all pages load correctly
- [ ] Test critical user flows
- [ ] Check PWA installation
- [ ] Verify offline functionality
- [ ] Monitor error logs
- [ ] Check performance metrics
- [ ] Test on multiple devices
- [ ] Verify SEO meta tags
- [ ] Check SSL certificate
- [ ] Monitor resource usage

## Support

For issues or questions:
- GitHub Issues: [github.com/yourusername/pack-list/issues]
- Email: support@packlist.app