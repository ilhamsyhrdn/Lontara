# 🚀 Quick Start - Deploy ke Vercel

## Prerequisites
- Akun [Vercel](https://vercel.com)
- Repository Git (GitHub/GitLab/Bitbucket)
- Database MongoDB (gunakan [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) - gratis)

## Langkah Deploy

### 1️⃣ Persiapan Database
```bash
# Buat cluster di MongoDB Atlas
# Whitelist IP: 0.0.0.0/0 (untuk Vercel)
# Copy connection string
```

### 2️⃣ Push ke Git
```bash
git add .
git commit -m "Ready for Vercel"
git push origin main
```

### 3️⃣ Deploy di Vercel

1. Buka [vercel.com/new](https://vercel.com/new)
2. **Import** repository Anda
3. **Configure Project**:
   - Framework: Next.js ✓ (auto-detect)
   - Root: `./`
   - Build Command: `npm run vercel-build`

4. **Add Environment Variables**:
```env
DATABASE_URL=mongodb+srv://user:pass@cluster.mongodb.net/db
JWT_SECRET=your-random-secret-key
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_REDIRECT_URI=https://your-app.vercel.app/api/admin/google/callback
GMAIL_USER=your-email@gmail.com
GMAIL_PASSWORD=your-app-password
NEXT_PUBLIC_API_URL=https://your-app.vercel.app
NEXT_PUBLIC_FRONTEND_URL=https://your-app.vercel.app
NODE_ENV=production
```

5. Click **Deploy** 🚀

### 4️⃣ Update Google OAuth (jika menggunakan)
```
Google Cloud Console > Credentials
Add Authorized redirect URI:
https://your-app.vercel.app/api/admin/google/callback
https://your-app.vercel.app/api/user/gmail-callback
```

## Test Deployment

```bash
# Health check
curl https://your-app.vercel.app/api/health

# Should return: {"ok":true}
```

## Auto Deploy
Setiap push ke `main` branch akan otomatis deploy! 🎉

## Troubleshooting

**Build failed?**
- Check build logs di Vercel
- Run `npm run build` locally

**Database connection error?**
- Check DATABASE_URL
- Whitelist 0.0.0.0/0 di MongoDB Atlas

**Need help?**
- Lihat [DEPLOYMENT.md](./DEPLOYMENT.md) untuk dokumentasi lengkap
- Check [VERCEL_CHECKLIST.md](./VERCEL_CHECKLIST.md)

---

**Done!** ✅ Aplikasi Anda sekarang live di Vercel!
