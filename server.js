require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const methodOverride = require('method-override');
const session = require('express-session');
const flash = require('connect-flash');
const path = require('path');
const Question = require('./models/Question');

const app = express();

// --- Database Connection (DB se connect kar rahe hain) ---
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('✅ Connected to MongoDB Atlas'))
    .catch(err => console.error('❌ MongoDB Connection Error:', err));

// --- Middleware Configuration ---
app.set('view engine', 'ejs'); // EJS template engine use kar rahe hain
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public'))); // Public folder ko static bana rahe hain
app.use(bodyParser.urlencoded({ extended: true })); // Form data parse karne ke liye
app.use(methodOverride('_method')); // PUT/DELETE requests support karne ke liye
app.use(session({
    secret: process.env.SESSION_SECRET || 'secret', // Session secure karne ke liye secret key
    resave: false,
    saveUninitialized: false
}));
app.use(flash()); // Flash messages (error/success) dikhane ke liye

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
