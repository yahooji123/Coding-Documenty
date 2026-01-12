const express = require('express');
const router = express.Router();
const Question = require('../models/Question');

// --- Home Page (Welcome Screen) ---
router.get('/', async (req, res) => {
    // Jab user pehli baar visit kare toh welcome message dikhana
    res.render('index', { 
        welcome: true, 
        currentQuestion: null 
    });
});

// --- View Specific Question (Question detail page) ---
router.get('/question/:id', async (req, res) => {
    try {
        const question = await Question.findById(req.params.id);
        
        // Agar question nahi mila toh home page pe redirect
        if (!question) return res.redirect('/');
        
        res.render('index', { 
            welcome: false, 
            currentQuestion: question 
        });
    } catch (err) {
        console.error("Error fetching question:", err);
        res.redirect('/');
    }
});

module.exports = router;
