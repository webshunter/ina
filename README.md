# HUBUNK - AI Business Coach Platform

HUBUNK adalah platform konsultasi bisnis berbasis AI yang dirancang untuk membantu UMKM Indonesia berkembang. Platform ini terdiri dari landing page informatif dan sistem admin panel untuk mengelola konten.

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

## 🚀 Instalasi

1. Clone repository:
   ```bash
   git clone [repository-url]
   cd hubunk
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Buat file `.env`:
   ```env
   PORT=3000
   SESSION_SECRET=your-secret-key
   ```

4. Jalankan aplikasi:
   ```bash
   npm run dev   # untuk development
   npm start     # untuk production
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