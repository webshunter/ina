const bcrypt = require('bcrypt');
const db = require('../models/database');

const adminController = {
    // Authentication
    loginPage: (req, res) => {
        res.render('admin/login');
    },

    login: async (req, res) => {
        try {
            const { username, password } = req.body;
            const user = await db.getUserByUsername(username);

            if (!user) {
                return res.render('admin/login', { error: 'Username tidak ditemukan' });
            }

            const match = await bcrypt.compare(password, user.password);
            if (!match) {
                return res.render('admin/login', { error: 'Password salah' });
            }

            req.session.isAuthenticated = true;
            req.session.user = { id: user.id, username: user.username };
            res.redirect('/admin/dashboard');
        } catch (error) {
            console.error('Login error:', error);
            res.render('admin/login', { error: 'Terjadi kesalahan saat login' });
        }
    },

    logout: (req, res) => {
        req.session.destroy();
        res.redirect('/admin/login');
    },

    // Dashboard
    dashboard: async (req, res) => {
        try {
            const content = await db.getAllContent();
            const faqs = await db.getAllFaqs();
            const pricing = await db.getAllPricing();

            res.render('admin/dashboard', {
                content,
                faqs,
                pricing,
                user: req.session.user
            });
        } catch (error) {
            console.error('Dashboard error:', error);
            res.status(500).send('Terjadi kesalahan saat memuat dashboard');
        }
    },

    // Content Management
    updateContent: async (req, res) => {
        try {
            const { section, key, value } = req.body;
            await db.updateContent(section, key, value);
            res.json({ success: true });
        } catch (error) {
            console.error('Update content error:', error);
            res.status(500).json({ error: 'Gagal mengupdate konten' });
        }
    },

    // FAQ Management
    addFaq: async (req, res) => {
        try {
            const { question, answer, order_num } = req.body;
            await db.addFaq(question, answer, order_num);
            res.json({ success: true });
        } catch (error) {
            console.error('Add FAQ error:', error);
            res.status(500).json({ error: 'Gagal menambah FAQ' });
        }
    },

    updateFaq: async (req, res) => {
        try {
            const { id, question, answer, order_num } = req.body;
            await db.updateFaq(id, question, answer, order_num);
            res.json({ success: true });
        } catch (error) {
            console.error('Update FAQ error:', error);
            res.status(500).json({ error: 'Gagal mengupdate FAQ' });
        }
    },

    // Pricing Management
    updatePricing: async (req, res) => {
        try {
            const { id, plan_name, description, price, features } = req.body;
            await db.updatePricing(id, plan_name, description, price, features);
            res.json({ success: true });
        } catch (error) {
            console.error('Update pricing error:', error);
            res.status(500).json({ error: 'Gagal mengupdate pricing' });
        }
    }
};

module.exports = adminController; 