const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { isAuthenticated, isNotAuthenticated } = require('../middleware/auth');

// Redirect /admin to /admin/dashboard
router.get('/', isAuthenticated, (req, res) => {
    res.redirect('/admin/dashboard');
});

// Auth routes
router.get('/login', isNotAuthenticated, adminController.loginPage);
router.post('/login', isNotAuthenticated, adminController.login);
router.get('/logout', isAuthenticated, adminController.logout);

// Dashboard
router.get('/dashboard', isAuthenticated, adminController.dashboard);

// Content Management
router.get('/content', isAuthenticated, adminController.contentPage);
router.post('/content/update', isAuthenticated, adminController.updateContent);

// FAQ Management
router.get('/faq', isAuthenticated, adminController.faqPage);
router.post('/faq/add', isAuthenticated, adminController.addFaq);
router.post('/faq/update', isAuthenticated, adminController.updateFaq);

// Pricing Management
router.get('/pricing', isAuthenticated, adminController.pricingPage);
router.post('/pricing/update', isAuthenticated, adminController.updatePricing);
router.post('/pricing/delete', isAuthenticated, adminController.deletePricing);
router.post('/pricing/toggle-status', isAuthenticated, adminController.togglePricingStatus);

module.exports = router; 