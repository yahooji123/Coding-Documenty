const express = require('express');
const router = express.Router();
const Admin = require('../models/Admin');
const Question = require('../models/Question');

// =========================================================
// MIDDLEWARE: Check Authentication
// =========================================================
const isAuthenticated = (req, res, next) => {
    if (req.session.isAdmin) {
        return next();
    }
    req.flash('error', 'Please log in to view this resource');
    res.redirect('/admin/login');
};

// =========================================================
// 1. AUTH ROUTES
// =========================================================

// GET Login Page
router.get('/login', (req, res) => {
    if (req.session.isAdmin) {
        return res.redirect('/admin/dashboard');
    }
    res.render('admin/login', { title: 'Admin Login' });
});

// POST Login
router.post('/login', async (req, res) => {
    const { username, password } = req.body;
    
    try {
        const admin = await Admin.findOne({ username });
        
        if (!admin) {
            req.flash('error', 'Invalid username or password');
            return res.redirect('/admin/login');
        }

        const isMatch = await admin.comparePassword(password);
        if (!isMatch) {
            req.flash('error', 'Invalid username or password');
            return res.redirect('/admin/login');
        }

        // --- SESSION FIX START ---
        // Explicitly setting session data
        req.session.isAdmin = true;
        req.session.adminId = admin._id; 
        
        // Force save to prevent race conditions on redirect
        req.session.save((err) => {
            if (err) {
                console.error("Session Save Error:", err);
                req.flash('error', 'Session error. Please try again.');
                return res.redirect('/admin/login');
            }
            res.redirect('/admin/dashboard');
        });
        // --- SESSION FIX END ---

    } catch (err) {
        console.error(err);
        req.flash('error', 'Server error');
        res.redirect('/admin/login');
    }
});

// GET Logout
router.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) console.error("Logout Error:", err);
        res.redirect('/admin/login');
    });
});

// =========================================================
// 2. DASHBOARD & CRUD
// =========================================================

// GET Dashboard
router.get('/dashboard', isAuthenticated, async (req, res) => {
    try {
        const questions = await Question.find({}).sort({ createdAt: -1 });
        res.render('admin/dashboard', { 
            title: 'Admin Dashboard',
            questions: questions
        });
    } catch (err) {
        console.error(err);
        res.redirect('/');
    }
});

// GET Add Page
router.get('/add', isAuthenticated, (req, res) => {
    res.render('admin/form', { 
        title: 'Add New Question',
        action: '/admin/add',
        question: {} 
    });
});

// POST Add Question
router.post('/add', isAuthenticated, async (req, res) => {
    try {
        const newQuestion = new Question(req.body);
        await newQuestion.save();
        req.flash('success', 'Question added successfully');
        
        req.session.save(() => {
            res.redirect('/admin/dashboard');
        });
    } catch (err) {
        console.error(err);
        req.flash('error', 'Error adding question');
        res.redirect('/admin/add');
    }
});

// GET Edit Page
router.get('/edit/:id', isAuthenticated, async (req, res) => {
    try {
        const question = await Question.findById(req.params.id);
        if (!question) {
            req.flash('error', 'Question not found');
            return res.redirect('/admin/dashboard');
        }
        res.render('admin/form', { 
            title: 'Edit Question',
            action: `/admin/edit/${question._id}?_method=PUT`,
            question: question 
        });
    } catch (err) {
        console.error(err);
        res.redirect('/admin/dashboard');
    }
});

// PUT Update Question
router.put('/edit/:id', isAuthenticated, async (req, res) => {
    try {
        await Question.findByIdAndUpdate(req.params.id, req.body);
        req.flash('success', 'Question updated successfully');
        
        req.session.save(() => {
            res.redirect('/admin/dashboard');
        });
    } catch (err) {
        console.error(err);
        req.flash('error', 'Error updating question');
        res.redirect(`/admin/edit/${req.params.id}`);
    }
});

// DELETE Question
router.delete('/delete/:id', isAuthenticated, async (req, res) => {
    try {
        await Question.findByIdAndDelete(req.params.id);
        req.flash('success', 'Question deleted successfully');
        
        req.session.save(() => {
            res.redirect('/admin/dashboard');
        });
    } catch (err) {
        console.error(err);
        req.flash('error', 'Error deleting question');
        res.redirect('/admin/dashboard');
    }
});

// =========================================================
// 3. SPECIAL: FIRST ADMIN SETUP (Auto-disable after use)
// =========================================================
router.get('/register-first-admin', async (req, res) => {
    try {
        const count = await Admin.countDocuments();
        if (count > 0) {
            req.flash('error', 'Admin already exists. Please login.');
            return res.redirect('/admin/login');
        }
        // If no admin, allow quick create
        res.send(`
            <h1>Create First Admin</h1>
            <form action="/admin/register-first-admin" method="POST">
                <input type="text" name="username" placeholder="Username" required>
                <input type="password" name="password" placeholder="Password" required>
                <button type="submit">Create Admin</button>
            </form>
        `);
    } catch (err) {
        res.send("Error checking admin status");
    }
});

router.post('/register-first-admin', async (req, res) => {
    try {
        const count = await Admin.countDocuments();
        if (count > 0) return res.status(403).send("Admin already exists");

        const { username, password } = req.body;
        const newAdmin = new Admin({ username, password });
        await newAdmin.save();
        
        res.send("Admin created! <a href='/admin/login'>Go to Login</a>");
    } catch (err) {
        res.send("Error creating admin: " + err.message);
    }
});

module.exports = router;
