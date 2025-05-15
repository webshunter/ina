require('dotenv').config();
const express = require('express');
const path = require('path');
const session = require('express-session');
const SQLiteStore = require('connect-sqlite3')(session);
const db = require('./models/database');
const adminRoutes = require('./routes/admin');

const app = express();
const port = process.env.PORT || 3000;

// Initialize database
db.initializeDatabase();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Session setup
app.use(session({
    store: new SQLiteStore({
        db: 'sessions.db',
        dir: './data'
    }),
    secret: process.env.SESSION_SECRET || 'your-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));

// View engine setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Routes
app.use('/admin', adminRoutes);

// Landing page route with dynamic content
app.get('/', async (req, res) => {
    try {
        const content = await db.getAllContent();
        const faqs = await db.getAllFaqs();
        const pricing = await db.getAllPricing();

        // Transform content array to object for easier access
        const contentObj = content.reduce((acc, item) => {
            if (!acc[item.section]) {
                acc[item.section] = {};
            }
            acc[item.section][item.key] = item.value;
            return acc;
        }, {});

        res.render('index', {
            content: contentObj,
            faqs,
            pricing
        });
    } catch (error) {
        console.error('Error loading landing page:', error);
        res.status(500).send('Internal Server Error');
    }
});

// Start server
app.listen(port, () => {
    console.log(`✅ Main application listening on port ${port}`);
}); 