require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const methodOverride = require('method-override');
const session = require('express-session');
const MongoStore = require('connect-mongo').default;
const flash = require('connect-flash');
const path = require('path');
const helmet = require('helmet');
const compression = require('compression');
const Question = require('./models/Question');

const app = express();

const isProduction = process.env.NODE_ENV === 'production';

// --- Database Connection ---
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('✅ Connected to MongoDB Atlas'))
    .catch(err => console.error('❌ MongoDB Connection Error:', err));

// --- Security & Performance ---
app.use(helmet({ contentSecurityPolicy: false }));
app.use(compression());

// --- Basic Config ---
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(methodOverride('_method'));

// --- Render/HTTPS Session Configuration ---
app.set('trust proxy', 1); // Required for secure cookies on Render

app.use(session({
    name: 'coding-documenty.sid',
    secret: process.env.SESSION_SECRET || 'dev_secret_key',
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
        mongoUrl: process.env.MONGODB_URI,
        collectionName: 'sessions',
        ttl: 14 * 24 * 60 * 60, // 14 days
        autoRemove: 'native'
    }),
    cookie: {
        secure: isProduction, // true on Render (HTTPS)
        httpOnly: true,
        sameSite: isProduction ? 'none' : 'lax', // 'none' required for cross-site on some HTTPS setups
        maxAge: 1000 * 60 * 60 * 24 * 14 // 14 days
    }
}));

app.use(flash());

// --- Global Variables ---
app.use(async (req, res, next) => {
    try {
        const allQuestions = await Question.find({}).sort({ chapter: 1, title: 1 });
        const chapters = {};
        allQuestions.forEach(q => {
            if (!chapters[q.chapter]) chapters[q.chapter] = [];
            chapters[q.chapter].push(q);
        });

        res.locals.sidebarChapters = chapters;
        res.locals.currentPath = req.path;
        res.locals.isAdmin = !!req.session.isAdmin; // Boolean conversion
        res.locals.success = req.flash('success');
        res.locals.error = req.flash('error');
        next();
    } catch (err) {
        console.error("Sidebar Error:", err);
        next();
    }
});

// --- Routes ---
app.use('/', require('./routes/index'));
app.use('/admin', require('./routes/admin'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
});
