const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcrypt');

const dbPath = process.env.DB_PATH || path.resolve(__dirname, '../data/database.sqlite');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database:', err);
        process.exit(1);
    }
    console.log('✅ Connected to database');
});

// Handle database errors
db.on('error', (err) => {
    console.error('Database error:', err);
});

// Initialize database
function initializeDatabase() {
    db.serialize(() => {
        // Users table
        db.run(`CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            role TEXT CHECK(role IN ('admin', 'user')) DEFAULT 'user',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            last_login DATETIME
        )`);

        // Content table
        db.run(`CREATE TABLE IF NOT EXISTS content (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            section TEXT NOT NULL,
            key TEXT NOT NULL,
            value TEXT,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(section, key)
        )`);

        // FAQ table
        db.run(`CREATE TABLE IF NOT EXISTS faqs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            question TEXT NOT NULL,
            answer TEXT,
            order_num INTEGER,
            is_active BOOLEAN DEFAULT 1,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);

        // Pricing table
        db.run(`CREATE TABLE IF NOT EXISTS pricing (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            plan_name TEXT NOT NULL,
            description TEXT,
            price INTEGER,
            features TEXT,
            is_active BOOLEAN DEFAULT 1,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);

        // Consultations table
        db.run(`CREATE TABLE IF NOT EXISTS consultations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            status TEXT CHECK(status IN ('pending', 'active', 'completed', 'cancelled')) DEFAULT 'pending',
            type TEXT CHECK(type IN ('free', 'paid')) DEFAULT 'free',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            completed_at DATETIME,
            FOREIGN KEY(user_id) REFERENCES users(id)
        )`);

        // Chat messages table
        db.run(`CREATE TABLE IF NOT EXISTS chat_messages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            consultation_id INTEGER NOT NULL,
            sender TEXT CHECK(sender IN ('user', 'ai')) NOT NULL,
            message TEXT NOT NULL,
            video_url TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(consultation_id) REFERENCES consultations(id)
        )`);

        // Reports table
        db.run(`CREATE TABLE IF NOT EXISTS reports (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            consultation_id INTEGER NOT NULL,
            file_url TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(consultation_id) REFERENCES consultations(id)
        )`);

        // Subscriptions table
        db.run(`CREATE TABLE IF NOT EXISTS subscriptions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            plan_id INTEGER NOT NULL,
            status TEXT CHECK(status IN ('active', 'cancelled', 'expired')) DEFAULT 'active',
            start_date DATETIME DEFAULT CURRENT_TIMESTAMP,
            end_date DATETIME NOT NULL,
            FOREIGN KEY(user_id) REFERENCES users(id),
            FOREIGN KEY(plan_id) REFERENCES pricing(id)
        )`);

        // Payments table
        db.run(`CREATE TABLE IF NOT EXISTS payments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            amount INTEGER NOT NULL,
            status TEXT CHECK(status IN ('pending', 'completed', 'failed')) DEFAULT 'pending',
            payment_method TEXT NOT NULL,
            transaction_id TEXT UNIQUE,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(user_id) REFERENCES users(id)
        )`);

        // Create default admin if not exists
        const defaultAdmin = {
            username: 'vds',
            email: 'admin@hubunk.com',
            password: '88888888',
            role: 'admin'
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

                    db.run('INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)',
                        [defaultAdmin.username, defaultAdmin.email, hash, defaultAdmin.role],
                        (err) => {
                            if (err) {
                                console.error('Error creating admin:', err);
                                return;
                            }
                            console.log('✅ Default admin created');
                        });
                });
            }
        });

        // Insert default content
        const defaultContent = [
            ['hero', 'title', 'AI Bisnis Coach untuk UMKM Anda'],
            ['hero', 'description', 'Dapatkan solusi bisnis yang tepat dengan konsultasi AI di sini.'],
            ['about', 'description', 'Kami adalah platform konsultasi bisnis untuk membantu UMKM meraih kesuksesan melalui teknologi AI.']
        ];

        defaultContent.forEach(([section, key, value]) => {
            db.run('INSERT OR IGNORE INTO content (section, key, value) VALUES (?, ?, ?)',
                [section, key, value], (err) => {
                    if (err) {
                        console.error('Error inserting default content:', err);
                    }
                });
        });

        // Insert default FAQs
        const defaultFaqs = [
            {
                question: 'Apa itu HUBUNK?',
                answer: 'HUBUNK adalah platform AI Business Coach yang dirancang khusus untuk membantu UMKM di Indonesia berkembang melalui konsultasi bisnis berbasis AI.',
                order_num: 1
            },
            {
                question: 'Bagaimana cara memulai konsultasi?',
                answer: 'Anda dapat memulai dengan konsultasi gratis untuk mencoba layanan kami. Setelah login, pilih opsi "Mulai Konsultasi" dan ajukan pertanyaan Anda.',
                order_num: 2
            },
            {
                question: 'Apa perbedaan konsultasi gratis dan berbayar?',
                answer: 'Konsultasi gratis memiliki batasan topik dan durasi, sedangkan konsultasi berbayar memberikan akses ke analisis mendalam, laporan tertulis, dan video jawaban dari AI Coach.',
                order_num: 3
            }
        ];

        defaultFaqs.forEach((faq) => {
            db.run('INSERT OR IGNORE INTO faqs (question, answer, order_num) VALUES (?, ?, ?)',
                [faq.question, faq.answer, faq.order_num], (err) => {
                    if (err) {
                        console.error('Error inserting default FAQ:', err);
                    }
                });
        });

        // Insert default pricing plans
        const defaultPricing = [
            {
                plan_name: 'Starter',
                description: 'Cocok untuk UMKM yang baru memulai',
                price: 0,
                features: JSON.stringify([
                    'Konsultasi teks dengan AI',
                    'Topik terbatas',
                    'Durasi 15 menit/sesi'
                ])
            },
            {
                plan_name: 'Professional',
                description: 'Untuk UMKM yang ingin berkembang',
                price: 299000,
                features: JSON.stringify([
                    'Konsultasi teks & video dengan AI',
                    'Semua topik bisnis',
                    'Durasi 60 menit/sesi',
                    'Laporan PDF',
                    'Prioritas dukungan'
                ])
            },
            {
                plan_name: 'Enterprise',
                description: 'Solusi lengkap untuk bisnis Anda',
                price: 999000,
                features: JSON.stringify([
                    'Semua fitur Professional',
                    'Konsultasi tak terbatas',
                    'Analisis data bisnis',
                    'Perencanaan strategis',
                    'Dukungan 24/7'
                ])
            }
        ];

        defaultPricing.forEach((plan) => {
            db.run('INSERT OR IGNORE INTO pricing (plan_name, description, price, features) VALUES (?, ?, ?, ?)',
                [plan.plan_name, plan.description, plan.price, plan.features], (err) => {
                    if (err) {
                        console.error('Error inserting default pricing:', err);
                    }
                });
        });
    });
}

// Helper functions for CRUD operations
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

    getUserByEmail: (email) => {
        return new Promise((resolve, reject) => {
            db.get('SELECT * FROM users WHERE email = ?', [email], (err, row) => {
                if (err) reject(err);
                resolve(row);
            });
        });
    },

    createUser: (username, email, password) => {
        return new Promise((resolve, reject) => {
            bcrypt.hash(password, 10, (err, hash) => {
                if (err) reject(err);
                db.run('INSERT INTO users (username, email, password) VALUES (?, ?, ?)',
                    [username, email, hash], function(err) {
                        if (err) reject(err);
                        resolve(this.lastID);
                    });
            });
        });
    },

    // Content Management
    getAllContent: () => {
        return new Promise((resolve, reject) => {
            db.all('SELECT * FROM content', [], (err, rows) => {
                if (err) reject(err);
                resolve(rows || []);
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

    // FAQ Management
    getAllFaqs: () => {
        return new Promise((resolve, reject) => {
            db.all('SELECT * FROM faqs WHERE is_active = 1 ORDER BY order_num', [], (err, rows) => {
                if (err) reject(err);
                resolve(rows || []);
            });
        });
    },

    addFaq: (question, answer, order_num) => {
        return new Promise((resolve, reject) => {
            db.run('INSERT INTO faqs (question, answer, order_num) VALUES (?, ?, ?)',
                [question, answer, order_num], function(err) {
                    if (err) reject(err);
                    resolve(this.lastID);
                });
        });
    },

    updateFaq: (id, question, answer, order_num, is_active) => {
        return new Promise((resolve, reject) => {
            const sql = `
                UPDATE faqs 
                SET question = ?, 
                    answer = ?, 
                    order_num = ?, 
                    is_active = ?,
                    updated_at = CURRENT_TIMESTAMP 
                WHERE id = ?`;
            
            db.run(sql, [question, answer, order_num, is_active ? 1 : 0, id], (err) => {
                if (err) reject(err);
                resolve();
            });
        });
    },

    // Pricing Management
    getAllPricing: () => {
        return new Promise((resolve, reject) => {
            db.all('SELECT * FROM pricing WHERE is_active = 1', [], (err, rows) => {
                if (err) reject(err);
                resolve(rows || []);
            });
        });
    },

    addPricing: (plan_name, description, price, features) => {
        return new Promise((resolve, reject) => {
            db.run('INSERT INTO pricing (plan_name, description, price, features) VALUES (?, ?, ?, ?)',
                [plan_name, description, price, features], function(err) {
                    if (err) reject(err);
                    resolve(this.lastID);
                });
        });
    },

    updatePricing: (id, plan_name, description, price, features, is_active) => {
        return new Promise((resolve, reject) => {
            const sql = `
                UPDATE pricing 
                SET plan_name = ?, 
                    description = ?, 
                    price = ?, 
                    features = ?,
                    is_active = ?,
                    updated_at = CURRENT_TIMESTAMP 
                WHERE id = ?`;
            
            db.run(sql, [plan_name, description, price, features, is_active ? 1 : 0, id], (err) => {
                if (err) reject(err);
                resolve();
            });
        });
    },

    // Consultations
    createConsultation: (userId, type) => {
        return new Promise((resolve, reject) => {
            db.run('INSERT INTO consultations (user_id, type) VALUES (?, ?)',
                [userId, type], function(err) {
                    if (err) reject(err);
                    resolve(this.lastID);
                });
        });
    },

    getConsultationById: (id) => {
        return new Promise((resolve, reject) => {
            db.get('SELECT * FROM consultations WHERE id = ?', [id], (err, row) => {
                if (err) reject(err);
                resolve(row);
            });
        });
    },

    // Chat Messages
    addChatMessage: (consultationId, sender, message, videoUrl = null) => {
        return new Promise((resolve, reject) => {
            db.run('INSERT INTO chat_messages (consultation_id, sender, message, video_url) VALUES (?, ?, ?, ?)',
                [consultationId, sender, message, videoUrl], function(err) {
                    if (err) reject(err);
                    resolve(this.lastID);
                });
        });
    },

    // Reports
    createReport: (consultationId, fileUrl) => {
        return new Promise((resolve, reject) => {
            db.run('INSERT INTO reports (consultation_id, file_url) VALUES (?, ?)',
                [consultationId, fileUrl], function(err) {
                    if (err) reject(err);
                    resolve(this.lastID);
                });
        });
    },

    // Subscriptions
    createSubscription: (userId, planId, endDate) => {
        return new Promise((resolve, reject) => {
            db.run('INSERT INTO subscriptions (user_id, plan_id, end_date) VALUES (?, ?, ?)',
                [userId, planId, endDate], function(err) {
                    if (err) reject(err);
                    resolve(this.lastID);
                });
        });
    },

    // Payments
    createPayment: (userId, amount, paymentMethod) => {
        return new Promise((resolve, reject) => {
            db.run('INSERT INTO payments (user_id, amount, payment_method) VALUES (?, ?, ?)',
                [userId, amount, paymentMethod], function(err) {
                    if (err) reject(err);
                    resolve(this.lastID);
                });
        });
    },

    updatePaymentStatus: (transactionId, status) => {
        return new Promise((resolve, reject) => {
            db.run('UPDATE payments SET status = ? WHERE transaction_id = ?',
                [status, transactionId], (err) => {
                    if (err) reject(err);
                    resolve();
                });
        });
    }
};

// Cleanup on exit
process.on('SIGINT', () => {
    db.close((err) => {
        if (err) {
            console.error('Error closing database:', err);
        } else {
            console.log('Database connection closed');
        }
        process.exit(0);
    });
});

module.exports = {
    db,
    initializeDatabase,
    ...dbOperations
}; 