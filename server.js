require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const methodOverride = require('method-override');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const flash = require('connect-flash');
const path = require('path');
const helmet = require('helmet');
const compression = require('compression');
const Question = require('./models/Question');

const app = express();

// --- Database Connection (DB se connect kar rahe hain) ---
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('✅ Connected to MongoDB Atlas'))
    .catch(err => console.error('❌ MongoDB Connection Error:', err));

// --- Security & Performance Middleware ---
app.use(helmet({
    contentSecurityPolicy: false, // EJS aur inline styles ke liye disable kiya hai, production me configure kare
}));
app.use(compression()); // Responses ko compress karke fast banata hai

// --- Basic Middleware ---
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(methodOverride('_method'));

// --- Session Configuration (MongoDB Store ke saath) ---
app.set('trust proxy', 1); // Render/Heroku SSL ke liye zaroori hai

app.use(session({
    name: 'coding-documenty.sid',
    secret: process.env.SESSION_SECRET || 'fallbacksecret', // .env me hona chahiye
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
        mongoUrl: process.env.MONGODB_URI,
        collectionName: 'sessions', // DB me is naam se collection banega
        ttl: 14 * 24 * 60 * 60, // 14 days
        autoRemove: 'native'
    }),
    cookie: {
        secure: false,        // Render HTTPS issue fix
        httpOnly: true,
        sameSite: 'lax',      // Browser cookie block fix
        maxAge: 1000 * 60 * 60 * 24 * 14
    }


}));

app.use(flash());

// --- Global Middleware (Har request pe ye chalega) ---
app.use(async (req, res, next) => {
    try {
        // Sidebar Data fetch kar rahe hain (Har page pe sidebar chahiye)
        const allQuestions = await Question.find({}).sort({ chapter: 1, title: 1 });
        const chapters = {};

        // Questions ko chapters ke hisaab se group kar rahe hain
        allQuestions.forEach(q => {
            if (!chapters[q.chapter]) {
                chapters[q.chapter] = [];
            }
            chapters[q.chapter].push(q);
        });

        // Data ko locals mein daal rahe hain taaki har view mein access kar sakein
        res.locals.sidebarChapters = chapters;
        res.locals.currentPath = req.path;
        res.locals.isAdmin = req.session.isAdmin || false; // Admin check
        res.locals.success = req.flash('success'); // Success messages
        res.locals.error = req.flash('error'); // Error messages
        next();
    } catch (err) {
        console.error("Sidebar Data Error:", err);
        next();
    }
});

// --- Routes (Raste define kar rahe hain) ---
const indexRoutes = require('./routes/index');
const adminRoutes = require('./routes/admin');

app.use('/', indexRoutes); // Home routes
app.use('/admin', adminRoutes); // Admin routes mounted at /admin

// --- Server Start ---
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`🌍 Open http://localhost:${PORT}`);
});
