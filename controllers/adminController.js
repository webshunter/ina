const bcrypt = require('bcrypt');
const { db, ...dbOperations } = require('../models/database');
const PricingController = require('./PricingController');

const pricingController = new PricingController(db);

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
    contentPage: async (req, res) => {
        try {
            const content = await db.getAllContent();
            res.render('admin/content', {
                content,
                user: req.session.user
            });
        } catch (error) {
            console.error('Content page error:', error);
            res.status(500).send('Terjadi kesalahan saat memuat halaman konten');
        }
    },

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
    faqPage: async (req, res) => {
        try {
            const faqs = await db.getAllFaqs();
            res.render('admin/faq', {
                faqs,
                user: req.session.user
            });
        } catch (error) {
            console.error('FAQ page error:', error);
            res.status(500).send('Terjadi kesalahan saat memuat halaman FAQ');
        }
    },

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
            const { id, question, answer, order_num, is_active } = req.body;
            await db.updateFaq(id, question, answer, order_num, is_active);
            res.json({ success: true });
        } catch (error) {
            console.error('Update FAQ error:', error);
            res.status(500).json({ error: 'Gagal mengupdate FAQ' });
        }
    },

    // Pricing Management
    pricingPage: async (req, res) => {
        try {
            const pricing = await pricingController.getAllPlans();
            res.render('admin/pricing', {
                pricing,
                user: req.session.user
            });
        } catch (error) {
            console.error('Pricing page error:', error);
            res.status(500).send('Terjadi kesalahan saat memuat halaman pricing');
        }
    },

    updatePricing: async (req, res) => {
        try {
            const { id, ...planData } = req.body;
            
            if (id) {
                await pricingController.updatePlan(id, planData);
            } else {
                await pricingController.createPlan(planData);
            }
            
            res.json({ success: true });
        } catch (error) {
            console.error('Update pricing error:', error);
            res.status(500).json({ error: 'Gagal mengupdate pricing' });
        }
    },

    deletePricing: async (req, res) => {
        try {
            const { id } = req.body;
            await pricingController.deletePlan(id);
            res.json({ success: true });
        } catch (error) {
            console.error('Delete pricing error:', error);
            res.status(500).json({ error: 'Gagal menghapus pricing' });
        }
    },

    togglePricingStatus: async (req, res) => {
        try {
            const { id, status } = req.body;
            await pricingController.togglePlanStatus(id, status);
            res.json({ success: true });
        } catch (error) {
            console.error('Toggle pricing status error:', error);
            res.status(500).json({ error: 'Gagal mengubah status pricing' });
        }
    }
};

module.exports = adminController; 