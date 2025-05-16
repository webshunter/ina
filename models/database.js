import pg from 'pg';
import bcrypt from 'bcrypt';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const pool = new pg.Pool({
    host: '145.223.22.181',
    port: 5433,
    user: 'vds',
    password: 'VdsHubunk123',
    database: 'hubunk_db'
});

// Handle database errors
pool.on('error', (err) => {
    console.error('Database error:', err);
});

// Initialize database
async function initializeDatabase() {
    const client = await pool.connect();
    try {
        // Users table
        await client.query(`
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                username VARCHAR(255) UNIQUE NOT NULL,
                email VARCHAR(255) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL,
                role VARCHAR(50) CHECK(role IN ('admin', 'user')) DEFAULT 'user',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                last_login TIMESTAMP
            )
        `);

        // Content table
        await client.query(`
            CREATE TABLE IF NOT EXISTS content (
                id SERIAL PRIMARY KEY,
                section VARCHAR(255) NOT NULL,
                key VARCHAR(255) NOT NULL,
                value TEXT,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(section, key)
            )
        `);

        // FAQ table
        await client.query(`
            CREATE TABLE IF NOT EXISTS faqs (
                id SERIAL PRIMARY KEY,
                question TEXT NOT NULL,
                answer TEXT,
                order_num INTEGER,
                is_active BOOLEAN DEFAULT true,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Pricing table
        await client.query(`
            CREATE TABLE IF NOT EXISTS pricing (
                id SERIAL PRIMARY KEY,
                plan_name VARCHAR(255) NOT NULL,
                description TEXT,
                price INTEGER,
                features TEXT,
                is_active BOOLEAN DEFAULT true,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Consultations table
        await client.query(`
            CREATE TABLE IF NOT EXISTS consultations (
                id SERIAL PRIMARY KEY,
                user_id INTEGER NOT NULL,
                status VARCHAR(50) CHECK(status IN ('pending', 'active', 'completed', 'cancelled')) DEFAULT 'pending',
                type VARCHAR(50) CHECK(type IN ('free', 'paid')) DEFAULT 'free',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                completed_at TIMESTAMP,
                FOREIGN KEY(user_id) REFERENCES users(id)
            )
        `);

        // Chat messages table
        await client.query(`
            CREATE TABLE IF NOT EXISTS chat_messages (
                id SERIAL PRIMARY KEY,
                consultation_id INTEGER NOT NULL,
                sender VARCHAR(50) CHECK(sender IN ('user', 'ai')) NOT NULL,
                message TEXT NOT NULL,
                video_url TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY(consultation_id) REFERENCES consultations(id)
            )
        `);

        // Reports table
        await client.query(`
            CREATE TABLE IF NOT EXISTS reports (
                id SERIAL PRIMARY KEY,
                consultation_id INTEGER NOT NULL,
                file_url TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY(consultation_id) REFERENCES consultations(id)
            )
        `);

        // Subscriptions table
        await client.query(`
            CREATE TABLE IF NOT EXISTS subscriptions (
                id SERIAL PRIMARY KEY,
                user_id INTEGER NOT NULL,
                plan_id INTEGER NOT NULL,
                status VARCHAR(50) CHECK(status IN ('active', 'cancelled', 'expired')) DEFAULT 'active',
                start_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                end_date TIMESTAMP NOT NULL,
                FOREIGN KEY(user_id) REFERENCES users(id),
                FOREIGN KEY(plan_id) REFERENCES pricing(id)
            )
        `);

        // Payments table
        await client.query(`
            CREATE TABLE IF NOT EXISTS payments (
                id SERIAL PRIMARY KEY,
                user_id INTEGER NOT NULL,
                amount INTEGER NOT NULL,
                status VARCHAR(50) CHECK(status IN ('pending', 'completed', 'failed')) DEFAULT 'pending',
                payment_method VARCHAR(255) NOT NULL,
                transaction_id VARCHAR(255) UNIQUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY(user_id) REFERENCES users(id)
            )
        `);

        // Create default admin if not exists
        const defaultAdmin = {
            username: 'vds',
            email: 'admin@hubunk.com',
            password: '88888888',
            role: 'admin'
        };

        const adminExists = await client.query('SELECT id FROM users WHERE username = $1', [defaultAdmin.username]);
        
        if (adminExists.rows.length === 0) {
            const hashedPassword = await bcrypt.hash(defaultAdmin.password, 10);
            await client.query(
                'INSERT INTO users (username, email, password, role) VALUES ($1, $2, $3, $4)',
                [defaultAdmin.username, defaultAdmin.email, hashedPassword, defaultAdmin.role]
            );
            console.log('✅ Default admin created');
        }

        // Insert default content
        const defaultContent = [
            ['hero', 'title', 'AI Bisnis Coach untuk UMKM Anda'],
            ['hero', 'description', 'Dapatkan solusi bisnis yang tepat dengan konsultasi AI di sini.'],
            ['about', 'description', 'Kami adalah platform konsultasi bisnis untuk membantu UMKM meraih kesuksesan melalui teknologi AI.']
        ];

        for (const [section, key, value] of defaultContent) {
            await client.query(
                'INSERT INTO content (section, key, value) VALUES ($1, $2, $3) ON CONFLICT (section, key) DO NOTHING',
                [section, key, value]
            );
        }

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

        for (const plan of defaultPricing) {
            await client.query(
                'INSERT INTO pricing (plan_name, description, price, features) VALUES ($1, $2, $3, $4) ON CONFLICT DO NOTHING',
                [plan.plan_name, plan.description, plan.price, plan.features]
            );
        }

    } catch (error) {
        console.error('Error initializing database:', error);
        throw error;
    } finally {
        client.release();
    }
}

// Helper functions for CRUD operations
const dbOperations = {
    // Users
    getUserByUsername: async (username) => {
        const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
        return result.rows[0];
    },

    getUserByEmail: async (email) => {
        const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        return result.rows[0];
    },

    createUser: async (username, email, password) => {
        const hashedPassword = await bcrypt.hash(password, 10);
        const result = await pool.query(
            'INSERT INTO users (username, email, password) VALUES ($1, $2, $3) RETURNING id',
            [username, email, hashedPassword]
        );
        return result.rows[0].id;
    },

    // Content Management
    getAllContent: async () => {
        const result = await pool.query('SELECT * FROM content');
        return result.rows;
    },

    updateContent: async (section, key, value) => {
        await pool.query(
            'UPDATE content SET value = $1, updated_at = CURRENT_TIMESTAMP WHERE section = $2 AND key = $3',
            [value, section, key]
        );
    },

    // FAQ Management
    getAllFaqs: async () => {
        const result = await pool.query('SELECT * FROM faqs WHERE is_active = true ORDER BY order_num');
        return result.rows;
    },

    addFaq: async (question, answer, order_num) => {
        const result = await pool.query(
            'INSERT INTO faqs (question, answer, order_num) VALUES ($1, $2, $3) RETURNING id',
            [question, answer, order_num]
        );
        return result.rows[0].id;
    },

    updateFaq: async (id, question, answer, order_num, is_active) => {
        await pool.query(
            `UPDATE faqs 
            SET question = $1, 
                answer = $2, 
                order_num = $3, 
                is_active = $4,
                updated_at = CURRENT_TIMESTAMP 
            WHERE id = $5`,
            [question, answer, order_num, is_active, id]
        );
    },

    // Pricing Management
    getAllPricing: async () => {
        const result = await pool.query('SELECT * FROM pricing WHERE is_active = true');
        return result.rows;
    },

    addPricing: async (plan_name, description, price, features) => {
        const result = await pool.query(
            'INSERT INTO pricing (plan_name, description, price, features) VALUES ($1, $2, $3, $4) RETURNING id',
            [plan_name, description, price, features]
        );
        return result.rows[0].id;
    },

    updatePricing: async (id, plan_name, description, price, features, is_active) => {
        await pool.query(
            `UPDATE pricing 
            SET plan_name = $1, 
                description = $2, 
                price = $3, 
                features = $4,
                is_active = $5,
                updated_at = CURRENT_TIMESTAMP 
            WHERE id = $6`,
            [plan_name, description, price, features, is_active, id]
        );
    },

    // Consultations
    createConsultation: async (userId, type) => {
        const result = await pool.query(
            'INSERT INTO consultations (user_id, type) VALUES ($1, $2) RETURNING id',
            [userId, type]
        );
        return result.rows[0].id;
    },

    getConsultationById: async (id) => {
        const result = await pool.query('SELECT * FROM consultations WHERE id = $1', [id]);
        return result.rows[0];
    },

    // Chat Messages
    addChatMessage: async (consultationId, sender, message, videoUrl = null) => {
        const result = await pool.query(
            'INSERT INTO chat_messages (consultation_id, sender, message, video_url) VALUES ($1, $2, $3, $4) RETURNING id',
            [consultationId, sender, message, videoUrl]
        );
        return result.rows[0].id;
    },

    // Reports
    createReport: async (consultationId, fileUrl) => {
        const result = await pool.query(
            'INSERT INTO reports (consultation_id, file_url) VALUES ($1, $2) RETURNING id',
            [consultationId, fileUrl]
        );
        return result.rows[0].id;
    },

    // Subscriptions
    createSubscription: async (userId, planId, endDate) => {
        const result = await pool.query(
            'INSERT INTO subscriptions (user_id, plan_id, end_date) VALUES ($1, $2, $3) RETURNING id',
            [userId, planId, endDate]
        );
        return result.rows[0].id;
    },

    // Payments
    createPayment: async (userId, amount, paymentMethod) => {
        const result = await pool.query(
            'INSERT INTO payments (user_id, amount, payment_method) VALUES ($1, $2, $3) RETURNING id',
            [userId, amount, paymentMethod]
        );
        return result.rows[0].id;
    },

    updatePaymentStatus: async (transactionId, status) => {
        await pool.query(
            'UPDATE payments SET status = $1 WHERE transaction_id = $2',
            [status, transactionId]
        );
    }
};

// Cleanup on exit
process.on('SIGINT', async () => {
    try {
        await pool.end();
        console.log('Database connection closed');
    } catch (err) {
        console.error('Error closing database:', err);
    }
    process.exit(0);
});

// Export the database instance and functions
export {
    dbOperations as default,
    initializeDatabase
};