# ✅ Vercel Deployment Checklist

## Pre-Deployment

### 1. Files & Configuration
- [x] `vercel.json` - Vercel configuration
- [x] `next.config.mjs` - Next.js configuration dengan serverless setup
- [x] `prisma/schema.prisma` - Database schema di root
- [x] `.env.example` - Template environment variables
- [x] `DEPLOYMENT.md` - Dokumentasi deployment
- [x] `.gitignore` - Exclude sensitive files

### 2. Package.json
- [x] All backend dependencies moved to main package.json
- [x] Build script: `prisma generate && next build`
- [x] Vercel build script: `prisma generate && prisma db push && next build`
- [x] Postinstall script: `prisma generate`

### 3. API Routes Converted
- [x] `/api/health` - Health check
- [x] `/api/auth/login` - User login
- [x] `/api/auth/me` - Get current user
- [x] `/api/ml/classify` - Email classification
- [x] `/api/ml/classify-batch` - Batch classification
- [x] `/api/ml/model-info` - Model information
- [x] `/api/admin/create-user` - Create user (admin)
- [x] `/api/user/activate` - Activate account
- [x] `/api/user/verify-token/[token]` - Verify activation token

### 4. Middleware & Utilities
- [x] `src/middleware.js` - JWT authentication middleware
- [x] `src/lib/prisma.js` - Prisma client singleton
- [x] Backend services accessible from API routes

## Environment Variables Required

Copy these to Vercel Dashboard or via CLI:

```bash
# Database
DATABASE_URL="mongodb+srv://..."

# JWT
JWT_SECRET="your-secret-key"

# Google OAuth
GOOGLE_CLIENT_ID="..."
GOOGLE_CLIENT_SECRET="..."
GOOGLE_REDIRECT_URI="https://your-app.vercel.app/api/admin/google/callback"

# Gmail
GMAIL_USER="your-email@gmail.com"
GMAIL_PASSWORD="your-app-password"

# Public URLs
NEXT_PUBLIC_API_URL="https://your-app.vercel.app"
NEXT_PUBLIC_FRONTEND_URL="https://your-app.vercel.app"

# Node Environment
NODE_ENV="production"
```

## Deployment Steps

### Via Vercel Dashboard

1. **Push to Git**
   ```bash
   git add .
   git commit -m "Ready for Vercel deployment"
   git push origin main
   ```

2. **Import to Vercel**
   - Go to [vercel.com/new](https://vercel.com/new)
   - Select your repository
   - Click "Import"

3. **Configure**
   - Framework Preset: Next.js ✓
   - Root Directory: ./
   - Build Command: `npm run vercel-build`
   - Output Directory: `.next`

4. **Add Environment Variables**
   - Copy all variables from `.env.example`
   - Set each one in Vercel dashboard

5. **Deploy**
   - Click "Deploy"
   - Wait 3-5 minutes

### Via CLI

```bash
# Install Vercel CLI (if not installed)
npm i -g vercel

# Login
vercel login

# Deploy
vercel

# Deploy to production
vercel --prod
```

## Post-Deployment

### 1. Test API Endpoints

```bash
# Health check
curl https://your-app.vercel.app/api/health

# Login (example)
curl -X POST https://your-app.vercel.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"password"}'
```

### 2. Update OAuth Callbacks
- Google Cloud Console > Credentials
- Add: `https://your-app.vercel.app/api/admin/google/callback`
- Add: `https://your-app.vercel.app/api/user/gmail-callback`

### 3. Update CORS (if needed)
If frontend and backend are on different domains, update CORS in middleware.

### 4. Monitor Logs
```bash
vercel logs [deployment-url]
```

## Troubleshooting

### Build Fails
- ✓ Check Vercel build logs
- ✓ Run `npm run build` locally
- ✓ Ensure all dependencies in package.json

### Environment Variables Not Working
- ✓ Redeploy after adding/changing env vars
- ✓ Use `NEXT_PUBLIC_` prefix for client-side vars
- ✓ Check spelling and values

### Database Connection Error
- ✓ Whitelist 0.0.0.0/0 in MongoDB Atlas
- ✓ Check DATABASE_URL format
- ✓ Test connection locally

### API Routes 404
- ✓ Check file structure: `src/app/api/[route]/route.js`
- ✓ Verify export names: `GET`, `POST`, etc.
- ✓ Check vercel.json routes

### ML Model Not Loading
- ✓ Ensure model files in correct path
- ✓ Check serverComponentsExternalPackages in next.config.mjs
- ✓ May need to reduce model size for serverless

## Performance Optimization

### 1. Database
- [ ] Add indexes for frequently queried fields
- [ ] Enable connection pooling
- [ ] Use read replicas if needed

### 2. Caching
- [ ] Implement Redis for session storage
- [ ] Cache ML model predictions
- [ ] Use Vercel Edge Caching for static content

### 3. Monitoring
- [ ] Set up Vercel Analytics
- [ ] Enable Error Tracking (Sentry)
- [ ] Monitor function execution times

## Next Steps

After successful deployment:

1. **Custom Domain** (optional)
   - Add domain in Vercel settings
   - Update DNS records
   
2. **CI/CD**
   - Auto-deploy on git push ✓ (already setup)
   - Add preview deployments for PRs

3. **Security**
   - Enable Vercel Web Application Firewall
   - Set up rate limiting
   - Regular security audits

4. **Backup**
   - Schedule MongoDB backups
   - Export environment variables
   - Document deployment process

---

## Quick Commands Reference

```bash
# Deploy to production
vercel --prod

# View logs
vercel logs

# List deployments
vercel ls

# Rollback to previous deployment
vercel rollback [deployment-url]

# Add environment variable
vercel env add [NAME] production

# Remove environment variable
vercel env rm [NAME] production
```

---

**Last Updated**: February 2026
**Status**: ✅ Ready for Deployment
