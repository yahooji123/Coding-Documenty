const express = require('express');
const router = express.Router();
const Question = require('../models/Question');
const Admin = require('../models/Admin');
const crypto = require('crypto');
const nodemailer = require('nodemailer');

// --- Middleware: Check Authentication (Login Check) ---
const checkAuth = (req, res, next) => {
    if (req.session.isAdmin) return next();
    req.flash('error', 'Please login to access admin panel');
    res.redirect('/admin/login');
};

// --- Login Routes ---

// Login Page Display
router.get('/login', (req, res) => {
    res.render('admin/login', { error: req.flash('error'), success: req.flash('success') });
});

// Login Process (DB Verify)
router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const admin = await Admin.findOne({ email });
        if (!admin) {
            req.flash('error', 'Invalid Email or Password');
            return res.redirect('/admin/login');
        }

        const isMatch = await admin.comparePassword(password);
        if (!isMatch) {
            req.flash('error', 'Invalid Email or Password');
            return res.redirect('/admin/login');
        }

        req.session.isAdmin = true;
        req.session.adminId = admin._id;
        
        // Explicitly save session before redirect (fixes race condition on some stores)
        req.session.save(err => {
            if (err) {
                console.error(err);
                req.flash('error', 'Session error');
                return res.redirect('/admin/login');
            }
            req.flash('success', 'Welcome Admin!');
            res.redirect('/admin/dashboard');
        });
    } catch (err) {
        console.error(err);
        req.flash('error', 'Login Error');
        res.redirect('/admin/login');
    }
});

// Logout
router.get('/logout', (req, res) => {
    req.session.destroy(); 
    res.redirect('/admin/login');
});

// --- Forgot Password Routes ---

router.get('/forgot-password', (req, res) => {
    res.render('admin/forgot-password', { error: req.flash('error'), success: req.flash('success') });
});

router.post('/forgot-password', async (req, res) => {
    try {
        const admin = await Admin.findOne({ email: req.body.email });
        if (!admin) {
            req.flash('error', 'No account with that email address exists.');
            return res.redirect('/admin/forgot-password');
        }

        const token = crypto.randomBytes(20).toString('hex');

        admin.resetPasswordToken = token;
        admin.resetPasswordExpires = Date.now() + 3600000; // 1 hour

        await admin.save();

        const transporter = nodemailer.createTransport({
            service: 'gmail', // Ya process.env.EMAIL_SERVICE
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });

        const mailOptions = {
            to: admin.email,
            from: process.env.EMAIL_USER,
            subject: 'Admin Password Reset',
            text: 'You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n' +
                'Please click on the following link, or paste this into your browser to complete the process:\n\n' +
                'http://' + req.headers.host + '/admin/reset-password/' + token + '\n\n' +
                'If you did not request this, please ignore this email and your password will remain unchanged.\n'
        };

        await transporter.sendMail(mailOptions);
        req.flash('success', 'An e-mail has been sent to ' + admin.email + ' with further instructions.');
        res.redirect('/admin/forgot-password');

    } catch (err) {
        console.error(err);
        req.flash('error', 'Error sending email');
        res.redirect('/admin/forgot-password');
    }
});

router.get('/reset-password/:token', async (req, res) => {
    try {
        const admin = await Admin.findOne({ 
            resetPasswordToken: req.params.token, 
            resetPasswordExpires: { $gt: Date.now() } 
        });

        if (!admin) {
            req.flash('error', 'Password reset token is invalid or has expired.');
            return res.redirect('/admin/forgot-password');
        }
        res.render('admin/reset-password', { token: req.params.token, error: req.flash('error') });
    } catch (err) {
        res.redirect('/admin/forgot-password');
    }
});

router.post('/reset-password/:token', async (req, res) => {
    try {
        const admin = await Admin.findOne({ 
            resetPasswordToken: req.params.token, 
            resetPasswordExpires: { $gt: Date.now() } 
        });

        if (!admin) {
            req.flash('error', 'Password reset token is invalid or has expired.');
            return res.redirect('back');
        }

        if (req.body.password !== req.body.confirm) {
            req.flash('error', 'Passwords do not match.');
            return res.redirect('back');
        }

        admin.password = req.body.password;
        admin.resetPasswordToken = undefined;
        admin.resetPasswordExpires = undefined;

        await admin.save(); // Model ka pre-save hash karega
        
        req.flash('success', 'Success! Your password has been changed.');
        res.redirect('/admin/login');
    } catch (err) {
        console.error(err);
        req.flash('error', 'Error resetting password');
        res.redirect('back');
    }
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
