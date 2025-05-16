# 🚀 Hubunk AI Coach

AI Bisnis Coach untuk UMKM Indonesia. Platform konsultasi bisnis berbasis AI dengan Admin Panel profesional.

---

## 1. Requirements
- Node.js v18+
- PostgreSQL server (local/remote)
- npm

---

## 2. Clone Repository
```bash
git clone https://github.com/username/hubunk-ai-coach.git
cd hubunk-ai-coach
```

---

## 3. Install Dependencies
```bash
npm install
```

---

## 4. Environment Configuration

Salin file template:
```bash
cp env.template .env
```
Edit file `.env` sesuai kebutuhan, contoh:
```env
# Database
DB_TYPE=postgresql
DB_HOST=145.223.22.181
DB_PORT=5433
DB_NAME=hubunk_db
DB_USER=vds
DB_PASSWORD=VdsHubunk123
DB_URL=postgresql://vds:VdsHubunk123@145.223.22.181:5433/hubunk_db

# Security
SESSION_SECRET=isi_dengan_string_acak_aman
JWT_SECRET=isi_dengan_string_acak_aman

# Server
PORT=3001
NODE_ENV=production
```
**Tips:**  
Untuk membuat SESSION_SECRET/JWT_SECRET yang aman:  
Jalankan `openssl rand -hex 32` di terminal.

---

## 5. PostgreSQL Setup

### A. Buat Database & User (jika belum ada):
```sql
CREATE DATABASE hubunk_db;
CREATE USER vds WITH PASSWORD 'VdsHubunk123';
GRANT ALL PRIVILEGES ON DATABASE hubunk_db TO vds;
```

### B. Buat tabel session (jika pakai connect-pg-simple):
```sql
CREATE TABLE "session" (
  "sid" varchar NOT NULL COLLATE "default",
  "sess" json NOT NULL,
  "expire" timestamp(6) NOT NULL
)
WITH (OIDS=FALSE);

ALTER TABLE "session" ADD CONSTRAINT "session_pkey" PRIMARY KEY ("sid");
CREATE INDEX "IDX_session_expire" ON "session" ("expire");
```
Atau, cukup tambahkan `createTableIfMissing: true` di konfigurasi session pada kode.

---

## 6. Run the App
```bash
npm start
```
Akses aplikasi di:  
- **Landing Page:** http://localhost:3001  
- **Admin Panel:** http://localhost:3001/admin

---

## 7. Default Admin Login
- **Email:** admin@hubunk.com
- **Password:** 88888888

---

## 8. Customisasi
- Edit konten landing page, FAQ, dan pricing langsung dari AdminJS.
- Untuk branding, ganti file `/public/logo.png` dan `/public/favicon.ico`.

---

## 9. Troubleshooting
- **Port already in use:**  
  Matikan proses di port 3001:  
  `lsof -i :3001` lalu `kill -9 <PID>`
- **Database error:**  
  Pastikan PostgreSQL berjalan dan kredensial di `.env` benar.
- **Session error:**  
  Pastikan tabel `session` sudah ada di database.

---

## 10. Production
- Gunakan `pm2` untuk menjalankan aplikasi secara background:
  ```bash
  npm install -g pm2
  pm2 start index.js --name hubunk-ai-coach
  ```

---

**Saran:**  
Jangan commit file `.env` ke repository publik!

## 🚀 Fitur Utama

### Landing Page
- **Hero Section**: Menampilkan value proposition utama HUBUNK
- **Konsultasi**: Informasi layanan konsultasi AI
- **Pricing**: Paket layanan dengan harga yang transparan
- **About**: Informasi tentang HUBUNK
- **FAQ**: Pertanyaan yang sering diajukan

### Admin Panel
- **Dashboard**: Overview statistik dan aktivitas terkini
- **Content Management**: Pengelolaan konten landing page
- **FAQ Management**: Pengelolaan FAQ dengan fitur pengurutan
- **Pricing Management**: Pengelolaan paket layanan

## 🛠️ Teknologi

- **Backend**: Node.js dengan Express.js
- **Database**: SQLite3
- **View Engine**: EJS
- **CSS Framework**: Tailwind CSS
- **Icons**: Font Awesome
- **Authentication**: Session-based dengan bcrypt

## 📦 Dependencies

```json
{
  "dependencies": {
    "express": "^4.18.2",
    "dotenv": "^16.3.1",
    "ejs": "^3.1.9",
    "sqlite3": "^5.1.7",
    "bcrypt": "^5.1.1",
    "express-session": "^1.18.0",
    "connect-sqlite3": "^0.9.13"
  }
}
```

## 📁 Struktur Folder

```
hubunk/
├── controllers/
│   └── adminController.js
├── middleware/
│   └── auth.js
├── models/
│   └── database.js
├── public/
│   ├── css/
│   ├── js/
│   └── images/
├── routes/
│   └── admin.js
├── views/
│   ├── admin/
│   │   ├── layout.ejs
│   │   ├── login.ejs
│   │   ├── dashboard.ejs
│   │   ├── content.ejs
│   │   ├── faq.ejs
│   │   └── pricing.ejs
│   └── index.ejs
├── data/
│   └── database.sqlite
├── index.js
└── package.json
```

## 🔐 Admin Panel

### Akses Admin Panel
- URL: `/admin/login`
- Default credentials:
  - Username: `admin`
  - Password: `admin123`

### Fitur Admin Panel

1. **Dashboard**
   - Statistik konten
   - Jumlah FAQ aktif
   - Jumlah paket pricing
   - Update konten terbaru

2. **Content Management**
   - Edit hero section
   - Edit about section
   - Preview perubahan
   - Simpan multiple perubahan

3. **FAQ Management**
   - Tambah/edit FAQ
   - Atur urutan dengan drag & drop
   - Toggle status aktif/nonaktif
   - Preview di landing page

4. **Pricing Management**
   - Tambah/edit paket layanan
   - Set harga dan fitur
   - Toggle status aktif/nonaktif
   - Format harga otomatis

## 🔒 Keamanan

- Session-based authentication
- Password hashing dengan bcrypt
- CSRF protection
- Secure session storage dengan SQLite
- Input sanitization

## 🚀 Deployment

1. Setup production environment:
   ```bash
   npm install -g pm2
   ```

2. Start application:
   ```bash
   npm run deploy
   ```

3. Monitor application:
   ```bash
   pm2 status
   pm2 logs
   ```

## 📝 Development

### Database Schema

1. **Users Table**
   ```sql
   CREATE TABLE users (
       id INTEGER PRIMARY KEY AUTOINCREMENT,
       username TEXT UNIQUE NOT NULL,
       password TEXT NOT NULL,
       created_at DATETIME DEFAULT CURRENT_TIMESTAMP
   )
   ```

2. **Content Table**
   ```sql
   CREATE TABLE content (
       id INTEGER PRIMARY KEY AUTOINCREMENT,
       section TEXT NOT NULL,
       key TEXT NOT NULL,
       value TEXT,
       updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
       UNIQUE(section, key)
   )
   ```

3. **FAQ Table**
   ```sql
   CREATE TABLE faqs (
       id INTEGER PRIMARY KEY AUTOINCREMENT,
       question TEXT NOT NULL,
       answer TEXT,
       order_num INTEGER,
       is_active BOOLEAN DEFAULT 1,
       updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
   )
   ```

4. **Pricing Table**
   ```sql
   CREATE TABLE pricing (
       id INTEGER PRIMARY KEY AUTOINCREMENT,
       plan_name TEXT NOT NULL,
       description TEXT,
       price INTEGER,
       features TEXT,
       is_active BOOLEAN DEFAULT 1,
       updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
   )
   ```

## 🤝 Kontribusi

1. Fork repository
2. Buat branch fitur (`git checkout -b feature/AmazingFeature`)
3. Commit perubahan (`git commit -m 'Add some AmazingFeature'`)
4. Push ke branch (`git push origin feature/AmazingFeature`)
5. Buat Pull Request

## 📄 Lisensi

Distributed under the MIT License. See `LICENSE` for more information.

## 📞 Support

Untuk bantuan dan pertanyaan, silakan hubungi tim support HUBUNK:
- Email: support@hubunk.com
- Website: https://hubunk.com 