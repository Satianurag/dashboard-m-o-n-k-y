# Production Deployment Guide

## Deployment Options

### Option 1: Vercel (Recommended for Next.js)

1. **Install Vercel CLI:**
   ```bash
   npm i -g vercel
   ```

2. **Login to Vercel:**
   ```bash
   vercel login
   ```

3. **Deploy:**
   ```bash
   vercel --prod
   ```

4. **Set Environment Variables in Vercel Dashboard:**
   - Go to your project settings
   - Navigate to "Environment Variables"
   - Add all variables from `.env.production`

### Option 2: Docker + VPS

1. **Create Dockerfile:**
   ```dockerfile
   FROM node:20-alpine AS base
   
   FROM base AS deps
   RUN apk add --no-cache libc6-compat
   WORKDIR /app
   COPY package*.json ./
   RUN npm ci
   
   FROM base AS builder
   WORKDIR /app
   COPY --from=deps /app/node_modules ./node_modules
   COPY . .
   ENV NEXT_TELEMETRY_DISABLED 1
   RUN npm run build
   
   FROM base AS runner
   WORKDIR /app
   ENV NODE_ENV production
   ENV NEXT_TELEMETRY_DISABLED 1
   
   RUN addgroup --system --gid 1001 nodejs
   RUN adduser --system --uid 1001 nextjs
   
   COPY --from=builder /app/public ./public
   COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
   COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
   
   USER nextjs
   EXPOSE 3000
   ENV PORT 3000
   
   CMD ["node", "server.js"]
   ```

2. **Build and Run:**
   ```bash
   docker build -t xandeum-pnode-analytics .
   docker run -p 3000:3000 --env-file .env.production xandeum-pnode-analytics
   ```

### Option 3: Self-Hosted with PM2

1. **Install PM2:**
   ```bash
   npm install -g pm2
   ```

2. **Build for Production:**
   ```bash
   npm run build
   ```

3. **Start with PM2:**
   ```bash
   pm2 start npm --name "xandeum-analytics" -- start
   pm2 save
   pm2 startup
   ```

## Production Checklist

- [x] TypeScript errors resolved (`ignoreBuildErrors: false`)
- [x] Image optimization enabled
- [x] Security headers configured
- [x] Environment variables set
- [x] Build successful with no errors
- [ ] Domain configured (if using custom domain)
- [ ] SSL/TLS certificate installed
- [ ] Analytics/monitoring setup (optional)
- [ ] Backup strategy for Supabase data

## Performance Optimizations Applied

✅ Image optimization (AVIF/WebP)
✅ Webpack optimizations
✅ 5-minute data caching
✅ Server-side rendering for key pages
✅ Static page generation where possible

## Security Headers

- X-Frame-Options: SAMEORIGIN
- X-Content-Type-Options: nosniff
- Strict-Transport-Security (HSTS)
- Referrer-Policy: origin-when-cross-origin

## Monitoring

Consider adding:
- Vercel Analytics (built-in if using Vercel)
- Sentry for error tracking
- LogRocket for session replay
- Supabase monitoring dashboard
