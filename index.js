import 'dotenv/config';
import express from 'express';
import path from 'path';
import session from 'express-session';
import pgSession from 'connect-pg-simple';
import expressLayouts from 'express-ejs-layouts';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import start from './admin.js';
import pg from 'pg';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const pgPool = new pg.Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'hubunk'
});

const PgStore = pgSession(session);

import db, { initializeDatabase } from './models/database.js';
import apiRoutes from './routes/api.js';

const app = express();
const port = process.env.PORT || 3001;

// Initialize database
initializeDatabase();

// Security middleware
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'", "http://45.223.22.181", "https://45.223.22.181"],
            styleSrc: ["'self'", "'unsafe-inline'", "http:", "https:"],
            scriptSrc: ["'self'", "'unsafe-inline'", "http:", "https:"],
            imgSrc: ["'self'", "data:", "http:", "https:"],
            connectSrc: ["'self'", "https:", "http:"],
            fontSrc: ["'self'", "https:", "http:"],
            objectSrc: ["'none'"],
            mediaSrc: ["'self'", "https:", "http:"],
            frameSrc: ["'self'"]
        }
    }
}));

// Rate limiting
const limiter = rateLimit({
    windowMs: process.env.RATE_LIMIT_WINDOW_MS || 900000, // 15 minutes
    max: process.env.RATE_LIMIT_MAX_REQUESTS || 100
});
app.use('/api/', limiter);

// CORS
app.use(cors({
    origin: process.env.NODE_ENV === 'production' ? process.env.FRONTEND_URL : '*',
    credentials: true
}));

// Middleware
app.use(express.static(path.join(__dirname, 'public')));

// View engine setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Setup express-ejs-layouts
app.use(expressLayouts);
app.set('layout extractStyles', true);
app.set('layout extractScripts', true);

// Session setup
app.use(session({
    store: new PgStore({
        pool: pgPool,
        tableName: 'session'
    }),
    secret: process.env.SESSION_SECRET || 'your-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));

// Start AdminJS
start().then(({ admin, router }) => {
    app.use(admin.options.rootPath, router);

    // Body parser harus setelah AdminJS router
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));

    app.listen(port, () => {
        console.log(`Server is running on port ${port}`);
        console.log(`AdminJS started on http://localhost:${port}${admin.options.rootPath}`);
    });
}).catch(error => {
    console.error('Failed to start AdminJS:', error);
});

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
            layout: 'layout',
            content: contentObj,
            faqs,
            pricing,
            user: req.session.user
        });
    } catch (error) {
        console.error('Error loading landing page:', error);
        res.status(500).send('Internal Server Error');
    }
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something broke!');
}); 