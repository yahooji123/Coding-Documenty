const express = require('express');
const router = express.Router();
const Question = require('../models/Question');

// --- Middleware: Check Authentication (Login Check) ---
const checkAuth = (req, res, next) => {
    if (req.session.isAdmin) return next();
    req.flash('error', 'Please login to access admin panel');
    res.redirect('/admin/login');
};

// --- Login Routes ---

// Login Page Display
router.get('/login', (req, res) => {
    res.render('admin/login', { error: req.flash('error') });
});

// Login Process (Password Verify)
router.post('/login', (req, res) => {
    const { password } = req.body;
    // Check if password matches .env value
    if (password === process.env.ADMIN_PASSWORD) {
        req.session.isAdmin = true;
        req.flash('success', 'Welcome Admin!');
        res.redirect('/admin/dashboard');
    } else {
        req.flash('error', 'Incorrect Password');
        res.redirect('/admin/login');
    }
});

// Logout
router.get('/logout', (req, res) => {
    req.session.destroy(); // Session khatam kar rahe hain
    res.redirect('/');
});

// --- Dashboard Routes ---

// Dashboard Display (Check Login first)
router.get('/dashboard', checkAuth, async (req, res) => {
    try {
        // Saare questions fetch kar rahe hain, latest pehle
        const questions = await Question.find({}).sort({ createdAt: -1 });
        res.render('admin/dashboard', { 
            questions,
            success: req.flash('success'),
            error: req.flash('error')
        });
    } catch (err) {
        console.error(err);
        res.redirect('/');
    }
});

// --- CRUD Operations (Add, Edit, Delete) ---

// Add Question Form Show
router.get('/add', checkAuth, (req, res) => {
    res.render('admin/form', { 
        question: undefined,
        error: req.flash('error')
    }); 
});

// Create New Question (Database mein save)
router.post('/add', checkAuth, async (req, res) => {
    const { chapter, title, code, output, language, difficulty } = req.body;
    try {
        await Question.create({
            chapter,
            title,
            code,
            output,
            language,
            difficulty: difficulty || 'Medium',
            fileName: `${title}.${language === 'cpp' ? 'cpp' : 'txt'}`
        });
        req.flash('success', 'Question added successfully!');
        res.redirect('/admin/dashboard');
    } catch (err) {
        console.error(err);
        req.flash('error', 'Error adding question.');
        res.redirect('/admin/add');
    }
});

// Edit Question Form Show
router.get('/edit/:id', checkAuth, async (req, res) => {
    try {
        const question = await Question.findById(req.params.id);
        res.render('admin/form', { 
            question,
            error: req.flash('error') 
        });
    } catch (err) {
        req.flash('error', 'Question not found');
        res.redirect('/admin/dashboard');
    }
});

// Update Existing Question
router.put('/edit/:id', checkAuth, async (req, res) => {
    const { chapter, title, code, output, language, difficulty } = req.body;
    try {
        await Question.findByIdAndUpdate(req.params.id, {
            chapter,
            title,
            code,
            output,
            language,
            difficulty
        });
        req.flash('success', 'Question updated successfully!');
        res.redirect('/admin/dashboard');
    } catch (err) {
        console.error(err);
        req.flash('error', 'Error updating question');
        res.redirect('/admin/dashboard');
    }
});

// Delete Single Question
router.delete('/delete/:id', checkAuth, async (req, res) => {
    try {
        await Question.findByIdAndDelete(req.params.id);
        req.flash('success', 'Question deleted.');
        res.redirect('/admin/dashboard');
    } catch (err) {
        console.error(err);
        req.flash('error', 'Error deleting question');
        res.redirect('/admin/dashboard');
    }
});

// Delete Selected Questions (Bulk Delete)
router.post('/delete-selected', checkAuth, async (req, res) => {
    const { ids } = req.body;
    if (!ids || ids.length === 0) {
        req.flash('error', 'No questions selected.');
        return res.redirect('/admin/dashboard');
    }

    try {
        // ids can be a string (single) or array (multiple). Ensure array.
        const idArray = Array.isArray(ids) ? ids : [ids];
        await Question.deleteMany({ _id: { $in: idArray } });
        req.flash('success', `Deleted ${idArray.length} questions.`);
        res.redirect('/admin/dashboard');
    } catch (err) {
        console.error(err);
        req.flash('error', 'Error deleting questions.');
        res.redirect('/admin/dashboard');
    }
});

// Delete All Questions (Sab delete)
router.post('/delete-all', checkAuth, async (req, res) => {
    try {
        await Question.deleteMany({});
        req.flash('success', 'All questions have been deleted.');
        res.redirect('/admin/dashboard');
    } catch (err) {
        console.error(err);
        req.flash('error', 'Error deleting all questions.');
        res.redirect('/admin/dashboard');
    }
});

module.exports = router;
