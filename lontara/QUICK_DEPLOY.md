# Quick Commands untuk Deploy

## 1. PUSH KE GITHUB

### Buat Repository Baru di GitHub:
1. Buka: https://github.com/new
2. Repository name: `lontara`
3. Description: `AI-Powered Email Classification System with Next.js, React, and TensorFlow.js`
4. Public (untuk LinkedIn showcase)
5. Jangan centang "Initialize with README" (sudah ada)
6. Click "Create repository"

### Lalu jalankan commands ini di terminal:

```powershell
# Masuk ke folder project
cd c:\IlhamsyahProject\lontara\lontara\lontara

# Initialize git (jika belum)
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit: Lontara - AI Email Classification System

Features:
- AI-powered email classification using TensorFlow.js
- Gmail integration with OAuth2
- Interactive dashboard with Material-UI
- PDF processing and analysis
- JWT authentication
- MongoDB + Prisma ORM
- Serverless Next.js API routes"

# Set main branch
git branch -M main

# Add remote (GANTI YOUR_USERNAME dengan username GitHub Anda)
git remote add origin https://github.com/YOUR_USERNAME/lontara.git

# Push!
git push -u origin main
```

---

## 2. VERCEL DEPLOY

Setelah push ke GitHub:

1. Buka: https://vercel.com/new
2. Connect GitHub
3. Select repository: `lontara`
4. Click "Import"
5. **JANGAN klik Deploy dulu!**
6. Add Environment Variables dulu (lihat di bawah)

### Environment Variables (Copy & Paste ke Vercel):

```
DATABASE_URL
```
Value: (connection string dari MongoDB Atlas)

```
JWT_SECRET
```
Value: `lontara-jwt-secret-key-2026-change-this-in-production-min-32-chars`

```
GOOGLE_CLIENT_ID
```
Value: (dari Google Cloud Console)

```
GOOGLE_CLIENT_SECRET
```
Value: (dari Google Cloud Console)

```
GOOGLE_REDIRECT_URI
```
Value: `https://your-app.vercel.app/api/admin/google/callback` (update setelah deploy)

```
GMAIL_USER
```
Value: (your Gmail address)

```
GMAIL_PASSWORD
```
Value: (Gmail App Password 16 characters)

```
NEXT_PUBLIC_API_URL
```
Value: `https://your-app.vercel.app` (update setelah deploy)

```
NEXT_PUBLIC_FRONTEND_URL
```
Value: `https://your-app.vercel.app` (update setelah deploy)

```
NODE_ENV
```
Value: `production`

7. **Sekarang klik "Deploy"!**
8. Wait 3-5 minutes
9. Get your URL!

---

## 3. POST-DEPLOY UPDATE

Setelah dapat URL dari Vercel (misal: `lontara-abc123.vercel.app`):

### Update di Vercel:
1. Settings → Environment Variables
2. Edit:
   - `GOOGLE_REDIRECT_URI` → `https://lontara-abc123.vercel.app/api/admin/google/callback`
   - `NEXT_PUBLIC_API_URL` → `https://lontara-abc123.vercel.app`
   - `NEXT_PUBLIC_FRONTEND_URL` → `https://lontara-abc123.vercel.app`
3. Save
4. Deployments → Latest → Redeploy

### Update di Google Cloud Console:
1. https://console.cloud.google.com
2. Credentials → Edit OAuth 2.0 Client
3. Authorized redirect URIs → Add:
   ```
   https://lontara-abc123.vercel.app/api/admin/google/callback
   ```
4. Save

---

## 4. LINKEDIN POST

Copy salah satu template dari `LINKEDIN_POST.md`

Update placeholders:
- `[Your GitHub URL]` → `https://github.com/YOUR_USERNAME/lontara`
- `[Your Vercel URL]` → `https://lontara-abc123.vercel.app`

Add screenshots (4-5 images)

Post! 🚀

---

## QUICK CHECKLIST

- [ ] Create GitHub repository
- [ ] Push code to GitHub
- [ ] Setup MongoDB Atlas
- [ ] Setup Google OAuth
- [ ] Get Gmail App Password
- [ ] Deploy to Vercel with env variables
- [ ] Update URLs after deploy
- [ ] Test application
- [ ] Take screenshots
- [ ] Post on LinkedIn

---

**Estimated time: 50 minutes**

Good luck! 🍀
