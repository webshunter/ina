# Express Auto Deploy App

Aplikasi Express.js dengan sistem deployment otomatis menggunakan GitHub webhooks.

## Persyaratan

- Node.js
- npm
- PM2 (untuk process management)
- Git

## Instalasi di VPS

1. Clone repository
```bash
git clone [URL_REPOSITORY_ANDA]
cd [NAMA_FOLDER]
```

2. Setup environment
```bash
# Copy template environment
cp env.template .env

# Edit file .env dan sesuaikan nilai-nilainya
# Pastikan untuk mengganti WEBHOOK_SECRET dengan nilai yang aman
# Anda bisa generate secret dengan perintah: openssl rand -hex 32
nano .env
```

3. Install PM2 secara global (jika belum ada)
```bash
npm install -g pm2
```

4. Setup dan jalankan aplikasi
```bash
# Install dependencies dan jalankan dengan PM2
npm run setup
```

## Auto Deployment

1. Setup GitHub Webhook:
   - Buka repository GitHub Anda
   - Pergi ke Settings > Webhooks
   - Add webhook
   - Payload URL: `http://[IP_VPS_ANDA]:9000/webhook`
   - Content type: `application/json`
   - Secret: Masukkan nilai yang sama dengan WEBHOOK_SECRET di file .env
   - Pilih event: Just the push event

2. Cara kerja auto deployment:
   - Saat Anda melakukan push ke GitHub, webhook akan dipanggil
   - Server webhook di VPS akan menerima notifikasi
   - Script deployment akan menjalankan:
     - `git pull`: Mengambil kode terbaru
     - `npm install`: Update dependencies
     - `pm2 restart all`: Restart semua aplikasi

## Perintah PM2 yang Berguna

```bash
# Lihat status aplikasi
pm2 status

# Lihat logs
pm2 logs

# Lihat log aplikasi tertentu
pm2 logs main-app
pm2 logs deploy-webhook

# Restart aplikasi
pm2 restart all

# Stop aplikasi
pm2 stop all

# Hapus aplikasi dari PM2
pm2 delete all
```

## Script yang Tersedia

- `npm run setup`: Install dependencies dan jalankan aplikasi dengan PM2
- `npm run deploy`: Update kode dari GitHub dan restart aplikasi
- `npm run dev`: Jalankan aplikasi dalam mode development dengan nodemon
- `npm start`: Jalankan aplikasi tanpa PM2 (tidak disarankan untuk production)

## Catatan Keamanan

- Pastikan port 9000 (atau port yang Anda pilih untuk webhook) hanya dapat diakses dari IP GitHub
- Gunakan environment variables untuk konfigurasi sensitif
- Selalu backup data sebelum deployment
- Gunakan WEBHOOK_SECRET yang kuat (minimal 32 karakter acak)
- Jangan pernah meng-commit file .env ke repository 