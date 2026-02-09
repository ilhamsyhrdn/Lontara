# 🚀 Deploy ke Vercel

## Persiapan

### 1. Pastikan Akun Vercel Tersedia
- Buat akun di [vercel.com](https://vercel.com)
- Install Vercel CLI (opsional): `npm i -g vercel`

### 2. Siapkan Database MongoDB
- Gunakan MongoDB Atlas (gratis) atau provider lainnya
- Dapatkan connection string: `mongodb+srv://username:password@cluster.mongodb.net/database`

### 3. Persiapan Environment Variables
Anda memerlukan environment variables berikut:

```bash
DATABASE_URL="mongodb+srv://..."
JWT_SECRET="your-secret-key"
GOOGLE_CLIENT_ID="..."
GOOGLE_CLIENT_SECRET="..."
GOOGLE_REDIRECT_URI="https://your-app.vercel.app/api/admin/google/callback"
GMAIL_USER="your-email@gmail.com"
GMAIL_PASSWORD="your-app-password"
NEXT_PUBLIC_API_URL="https://your-app.vercel.app"
NEXT_PUBLIC_FRONTEND_URL="https://your-app.vercel.app"
```

## Cara Deploy

### Opsi 1: Deploy via Vercel Dashboard (Recommended)

1. **Push ke GitHub/GitLab/Bitbucket**
   ```bash
   git add .
   git commit -m "Ready for Vercel deployment"
   git push origin main
   ```

2. **Import Project di Vercel**
   - Buka [vercel.com/new](https://vercel.com/new)
   - Pilih repository Anda
   - Klik "Import"

3. **Konfigurasi Project**
   - Framework Preset: **Next.js** (otomatis terdeteksi)
   - Root Directory: `./` (default)
   - Build Command: `npm run vercel-build` (otomatis terdeteksi)
   - Output Directory: `.next` (otomatis terdeteksi)

4. **Set Environment Variables**
   - Klik "Environment Variables"
   - Tambahkan semua variabel dari `.env.example`
   - Pastikan semua nilai sudah benar

5. **Deploy**
   - Klik "Deploy"
   - Tunggu proses build selesai (3-5 menit)

### Opsi 2: Deploy via Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Login ke Vercel
vercel login

# Deploy (first time)
vercel

# Ikuti prompt untuk:
# - Set up project
# - Link ke existing project atau buat baru
# - Configure project settings

# Deploy production
vercel --prod
```

## Setelah Deploy

### 1. Set Environment Variables
Jika belum dilakukan saat setup:

```bash
# Via CLI
vercel env add DATABASE_URL
vercel env add JWT_SECRET
vercel env add GOOGLE_CLIENT_ID
# ... dst

# Atau via dashboard:
# Settings > Environment Variables
```

### 2. Update Google OAuth Redirect URI
- Buka [Google Cloud Console](https://console.cloud.google.com)
- Masuk ke Credentials > OAuth 2.0 Client IDs
- Tambahkan redirect URI: `https://your-app.vercel.app/api/admin/google/callback`

### 3. Update Frontend Environment Variables
Update di Vercel dashboard atau via CLI:
```bash
vercel env add NEXT_PUBLIC_API_URL production
vercel env add NEXT_PUBLIC_FRONTEND_URL production
```

### 4. Redeploy (jika perlu)
```bash
vercel --prod
```

## Struktur Deployment

```
Vercel Deployment:
├── Frontend (Next.js)
│   ├── Pages: /
│   ├── API Routes: /api/*
│   └── Static Assets: /public/*
│
├── Backend (Integrated as API Routes)
│   ├── /api/auth/* (authentication)
│   ├── /api/admin/* (admin routes)
│   ├── /api/user/* (user routes)
│   └── /api/ml/* (machine learning)
│
└── Database (MongoDB Atlas)
    └── Prisma Client
```

## Troubleshooting

### Build Failed
1. Check logs di Vercel dashboard
2. Pastikan semua dependencies ada di `package.json`
3. Jalankan `npm run build` secara lokal untuk test

### Environment Variables Not Working
1. Pastikan variabel sudah di-set di Vercel
2. Untuk variabel public, gunakan prefix `NEXT_PUBLIC_`
3. Redeploy setelah update environment variables

### Database Connection Error
1. Check connection string di `DATABASE_URL`
2. Pastikan IP Vercel sudah whitelisted di MongoDB Atlas (0.0.0.0/0)
3. Test connection string secara lokal

### API Routes 404
1. Check routing di `vercel.json`
2. Pastikan file route ada di `/src/app/api/`
3. Check Next.js API routes documentation

## Monitoring & Logs

### View Deployment Logs
```bash
vercel logs [deployment-url]
```

### View Runtime Logs
- Buka Vercel Dashboard
- Pilih project > Deployments > [deployment]
- Klik "Runtime Logs"

## Custom Domain (Opsional)

1. Buka project di Vercel Dashboard
2. Settings > Domains
3. Add domain Anda
4. Update DNS records sesuai instruksi
5. Wait for DNS propagation (sampai 48 jam)

## Auto Deploy

Setelah setup awal, setiap push ke branch `main` akan otomatis trigger deployment baru:

```bash
git add .
git commit -m "Update feature"
git push origin main
# Auto deploy akan berjalan
```

## Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
- [Prisma with Vercel](https://www.prisma.io/docs/guides/deployment/deployment-guides/deploying-to-vercel)

## Support

Jika ada masalah:
1. Check Vercel deployment logs
2. Check Vercel community forum
3. Check Next.js documentation
