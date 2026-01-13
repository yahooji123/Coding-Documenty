require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoStore = require('connect-mongo').MongoStore;
const flash = require('connect-flash');
const methodOverride = require('method-override');
const path = require('path');
const helmet = require('helmet');
const compression = require('compression');

// Import Models
const Question = require('./models/Question');

const app = express();

// =========================================================
// 1. DATABASE CONNECTION
// =========================================================
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('✅ Connected to MongoDB Atlas'))
    .catch(err => console.error('❌ MongoDB Connection Error:', err));

// =========================================================
// 2. MIDDLEWARE & CONFIG
// =========================================================

// Security & Performance
app.use(helmet({ contentSecurityPolicy: false }));
app.use(compression());

// View Engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Static Files & Parsing
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true })); // Replaces body-parser
app.use(express.json());
app.use(methodOverride('_method'));

// =========================================================
// 3. SESSION CONFIGURATION (CRITICAL FOR RENDER)
// =========================================================
const isProduction = process.env.NODE_ENV === 'production';

// Trust Proxy is REQUIRED for Render to identify HTTPS
app.set('trust proxy', 1);

app.use(session({
    name: 'admin_session',
    secret: process.env.SESSION_SECRET || 'super_secret_key_change_me',
    resave: false,             // Don't save session if unmodified
    saveUninitialized: false,  // Don't create session until something stored
    store: MongoStore.create({
        mongoUrl: process.env.MONGODB_URI,
        collectionName: 'sessions', // Collection name for sessions
        ttl: 14 * 24 * 60 * 60,     // 14 days
        autoRemove: 'native'
    }),
    cookie: {
        secure: isProduction, // TRUE on Render (HTTPS), FALSE on Localhost
        httpOnly: true,       // Prevents XSS script access
        sameSite: 'lax', // Use 'lax' for better compatibility on single domain
        maxAge: 1000 * 60 * 60 * 24 * 14 // 14 days
    }
}));

app.use(flash());

// =========================================================
// 4. GLOBAL LOCAL VARIABLES (Sidebar, Flash Messages)
// =========================================================
app.use(async (req, res, next) => {
    // Flash Messages
    res.locals.success = req.flash('success');
    res.locals.error = req.flash('error');
    
    // Auth State
    res.locals.isAdmin = !!req.session.isAdmin;
    res.locals.currentPath = req.path;

    // Sidebar Data (Available on ALL pages)
    try {
        const allQuestions = await Question.find({}).sort({ chapter: 1, title: 1 });
        const chapters = {};
        allQuestions.forEach(q => {
            if (!chapters[q.chapter]) chapters[q.chapter] = [];
            chapters[q.chapter].push(q);
        });
        res.locals.sidebarChapters = chapters;
    } catch (err) {
        console.error("Sidebar Data Error:", err);
        res.locals.sidebarChapters = {};
    }
    next();
});

// =========================================================
// 5. ROUTES
// =========================================================
app.use('/', require('./routes/index'));
app.use('/admin', require('./routes/admin'));

// =========================================================
// 6. SERVER START
// =========================================================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`🌍 Mode: ${isProduction ? 'Production' : 'Development'}`);
});
