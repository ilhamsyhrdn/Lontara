# 🚀 QUICK START - Deploy Tanpa Ribet!

## ✅ Login Demo: admin / admin123

---

## 📋 LANGKAH SIMPLE (30 Menit Total)

### **Step 1: Setup MongoDB (10 menit)**

1. **Buat Account MongoDB Atlas (GRATIS)**
   - Buka: https://www.mongodb.com/cloud/atlas/register
   - Sign up dengan Google atau email
   
2. **Create Free Cluster**
   - Choose: **FREE (M0)** tier
   - Provider: **AWS** atau **Google Cloud**
   - Region: Pilih yang terdekat (Singapore/Jakarta)
   - Cluster Name: `Cluster0` (default)
   - Click: **Create Cluster** (tunggu 3-5 menit)

3. **Setup Database Access**
   - Menu: **Database Access** → **Add New Database User**
   - Username: `lontara`
   - Password: `lontara2026` (atau generate auto)
   - Built-in Role: **Read and write to any database**
   - Click: **Add User**

4. **Setup Network Access**
   - Menu: **Network Access** → **Add IP Address**
   - Click: **Allow Access from Anywhere** (atau `0.0.0.0/0`)
   - Click: **Confirm**

5. **Get Connection String**
   - Menu: **Database** → **Connect** → **Connect your application**
   - Driver: Node.js
   - Copy connection string, contoh:
     ```
     mongodb+srv://lontara:lontara2026@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
     ```
   - Tambahkan `/lontara` sebelum `?`:
     ```
     mongodb+srv://lontara:lontara2026@cluster0.xxxxx.mongodb.net/lontara?retryWrites=true&w=majority
     ```

6. **Update .env**
   - Buka file `.env`
   - Ganti `DATABASE_URL` dengan connection string di atas

---

### **Step 2: Setup Database & Admin User (5 menit)**

```powershell
# 1. Install dependencies (jika belum)
npm install

# 2. Generate Prisma Client
npx prisma generate

# 3. Push database schema ke MongoDB
npx prisma db push

# 4. Seed admin user (admin/admin123)
node backend/src/scripts/seedAdmin.js

# 5. Jalankan development server
npm run dev
```

---

### **Step 3: Test Login (2 menit)**

1. Buka: http://localhost:3000
2. Login dengan:
   - **Username:** `admin`
   - **Password:** `admin123`
3. ✅ Sukses!

---

## 🌐 DEPLOY KE VERCEL (15 menit)

### **Step 1: Push ke GitHub**
```powershell
git add .
git commit -m "Ready for deployment"
git push origin main
```

### **Step 2: Deploy di Vercel**

1. **Import Project**
   - Buka: https://vercel.com/new
   - Import repository: `ilhamsyhrdn/Lontara`
   - Click: **Import**

2. **Add Environment Variables**
   
   Copy & paste satu per satu:

   **DATABASE_URL**
   ```
   mongodb+srv://lontara:lontara2026@cluster0.xxxxx.mongodb.net/lontara?retryWrites=true&w=majority
   ```
   *(Ganti dengan connection string MongoDB Anda)*

   **JWT_SECRET**
   ```
   e8f3a9d2b1c4f7a6e3d8c2b1a9f5e7d3c6b9f2a8e5d1c7b4a3f6e9d2c8b5a1f4
   ```

   **INIT_ADMIN_USERNAME**
   ```
   admin
   ```

   **INIT_ADMIN_PASSWORD**
   ```
   admin123
   ```

   **INIT_ADMIN_EMAIL**
   ```
   admin@lontara.com
   ```

   **GOOGLE_CLIENT_ID** (dummy - optional)
   ```
   dummy-client-id.apps.googleusercontent.com
   ```

   **GOOGLE_CLIENT_SECRET** (dummy - optional)
   ```
   dummy-secret
   ```

   **GMAIL_USER** (dummy - optional)
   ```
   dummy@gmail.com
   ```

   **GMAIL_PASSWORD** (dummy - optional)
   ```
   dummy-password
   ```

   **NEXT_PUBLIC_API_URL** (update setelah deploy)
   ```
   https://your-app.vercel.app
   ```

   **NEXT_PUBLIC_FRONTEND_URL** (update setelah deploy)
   ```
   https://your-app.vercel.app
   ```

   **GOOGLE_REDIRECT_URI** (update setelah deploy)
   ```
   https://your-app.vercel.app/api/admin/google/callback
   ```

   **NODE_ENV**
   ```
   production
   ```

3. **Deploy!**
   - Click: **Deploy**
   - Tunggu 3-5 menit
   - Akan dapat URL: `https://lontara-xxx.vercel.app`

4. **Update URLs (Setelah Deploy)**
   - Settings → Environment Variables
   - Edit `NEXT_PUBLIC_API_URL` → `https://lontara-xxx.vercel.app`
   - Edit `NEXT_PUBLIC_FRONTEND_URL` → `https://lontara-xxx.vercel.app`
   - Edit `GOOGLE_REDIRECT_URI` → `https://lontara-xxx.vercel.app/api/admin/google/callback`
   - Deployments → Latest → **Redeploy**

5. **Seed Admin di Production**
   - Vercel Dashboard → Project → **Settings** → **Functions**
   - Atau jalankan via local setelah update `.env` dengan production `DATABASE_URL`
   - Atau buat API route untuk seed (recommended)

---

## 🎯 KESIMPULAN

**Yang WAJIB:**
- ✅ MongoDB connection string (gratis dari Atlas)
- ✅ Admin user sudah default: `admin` / `admin123`
- ✅ JWT secret sudah auto-generated

**Yang OPTIONAL (bisa diabaikan untuk demo):**
- ❌ Google OAuth (hanya jika mau pakai Gmail integration)
- ❌ Gmail credentials (hanya jika mau send email)

**Total waktu setup: ~30 menit**

---

## 🔗 LOGIN CREDENTIALS

```
Username: admin
Password: admin123
```

Setelah login berhasil, bisa ganti password di settings!

---

## 📝 NOTES

- Fitur Gmail & OAuth **tidak wajib** untuk demo
- Admin user di-seed otomatis saat run `seedAdmin.js`
- Database hanya butuh MongoDB (gratis dari Atlas)
- Sisanya sudah auto-configured!

**Selamat mencoba! 🚀**
