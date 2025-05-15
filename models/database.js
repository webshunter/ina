const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcrypt');

const dbPath = path.resolve(__dirname, '../data/database.sqlite');
const db = new sqlite3.Database(dbPath);

// Inisialisasi database
function initializeDatabase() {
    db.serialize(() => {
        // Tabel users untuk admin
        db.run(`CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);

        // Tabel content untuk landing page
        db.run(`CREATE TABLE IF NOT EXISTS content (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            section TEXT NOT NULL,
            key TEXT NOT NULL,
            value TEXT,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(section, key)
        )`);

        // Tabel FAQ
        db.run(`CREATE TABLE IF NOT EXISTS faqs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            question TEXT NOT NULL,
            answer TEXT,
            order_num INTEGER,
            is_active BOOLEAN DEFAULT 1,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);

        // Tabel pricing
        db.run(`CREATE TABLE IF NOT EXISTS pricing (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            plan_name TEXT NOT NULL,
            description TEXT,
            price INTEGER,
            features TEXT,
            is_active BOOLEAN DEFAULT 1,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);

        // Buat admin default jika belum ada
        const defaultAdmin = {
            username: 'admin',
            password: 'admin123' // Ganti dengan password yang lebih aman
        };

        db.get('SELECT id FROM users WHERE username = ?', [defaultAdmin.username], (err, row) => {
            if (err) {
                console.error('Error checking admin:', err);
                return;
            }

            if (!row) {
                bcrypt.hash(defaultAdmin.password, 10, (err, hash) => {
                    if (err) {
                        console.error('Error hashing password:', err);
                        return;
                    }

                    db.run('INSERT INTO users (username, password) VALUES (?, ?)',
                        [defaultAdmin.username, hash],
                        (err) => {
                            if (err) {
                                console.error('Error creating admin:', err);
                                return;
                            }
                            console.log('Default admin created');
                        });
                });
            }
        });

        // Insert default content jika belum ada
        const defaultContent = [
            ['hero', 'title', 'AI Bisnis Coach untuk UMKM Anda'],
            ['hero', 'description', 'Dapatkan solusi bisnis yang tepat dengan konsultasi AI di sini.'],
            ['about', 'description', 'Kami adalah platform konsultasi bisnis untuk membantu UMKM meraih kesuksesan melalui teknologi AI.']
        ];

        defaultContent.forEach(([section, key, value]) => {
            db.run('INSERT OR IGNORE INTO content (section, key, value) VALUES (?, ?, ?)',
                [section, key, value]);
        });
    });
}

// Helper functions untuk CRUD operations
const dbOperations = {
    // Users
    getUserByUsername: (username) => {
        return new Promise((resolve, reject) => {
            db.get('SELECT * FROM users WHERE username = ?', [username], (err, row) => {
                if (err) reject(err);
                resolve(row);
            });
        });
    },

    // Content
    getAllContent: () => {
        return new Promise((resolve, reject) => {
            db.all('SELECT * FROM content', [], (err, rows) => {
                if (err) reject(err);
                resolve(rows);
            });
        });
    },

    updateContent: (section, key, value) => {
        return new Promise((resolve, reject) => {
            db.run('UPDATE content SET value = ?, updated_at = CURRENT_TIMESTAMP WHERE section = ? AND key = ?',
                [value, section, key], (err) => {
                    if (err) reject(err);
                    resolve();
                });
        });
    },

    // FAQs
    getAllFaqs: () => {
        return new Promise((resolve, reject) => {
            db.all('SELECT * FROM faqs ORDER BY order_num', [], (err, rows) => {
                if (err) reject(err);
                resolve(rows);
            });
        });
    },

    addFaq: (question, answer, order_num) => {
        return new Promise((resolve, reject) => {
            db.run('INSERT INTO faqs (question, answer, order_num) VALUES (?, ?, ?)',
                [question, answer, order_num], (err) => {
                    if (err) reject(err);
                    resolve();
                });
        });
    },

    updateFaq: (id, question, answer, order_num) => {
        return new Promise((resolve, reject) => {
            db.run('UPDATE faqs SET question = ?, answer = ?, order_num = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
                [question, answer, order_num, id], (err) => {
                    if (err) reject(err);
                    resolve();
                });
        });
    },

    // Pricing
    getAllPricing: () => {
        return new Promise((resolve, reject) => {
            db.all('SELECT * FROM pricing WHERE is_active = 1', [], (err, rows) => {
                if (err) reject(err);
                resolve(rows);
            });
        });
    },

    updatePricing: (id, plan_name, description, price, features) => {
        return new Promise((resolve, reject) => {
            db.run('UPDATE pricing SET plan_name = ?, description = ?, price = ?, features = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
                [plan_name, description, price, features, id], (err) => {
                    if (err) reject(err);
                    resolve();
                });
        });
    }
};

module.exports = {
    db,
    initializeDatabase,
    ...dbOperations
}; 