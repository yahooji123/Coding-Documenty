const express = require('express');
const router = express.Router();
const Question = require('../models/Question');

// =========================================================
// 1. HOME PAGE
// =========================================================
router.get('/', async (req, res) => {
    try {
        // Render the welcome screen
        res.render('index', { 
            title: 'Coder Project - DSA Tracker',
            welcome: true,
            currentQuestion: null 
        });
    } catch (err) {
        console.error(err);
        res.status(500).send("Server Error");
    }
});

// =========================================================
// 2. QUESTION DETAIL PAGE
// =========================================================
router.get('/question/:id', async (req, res) => {
    try {
        const question = await Question.findById(req.params.id);
        if (!question) {
            return res.status(404).render('404', { title: 'Not Found' });
        }

        res.render('index', { 
            title: question.title,
            welcome: false,
            currentQuestion: question
        });
    } catch (err) {
        console.error(err);
        res.redirect('/');
    }
});

// =========================================================
// 3. SEARCH
// =========================================================
router.get('/search', async (req, res) => {
    try {
        const query = req.query.q;
        if (!query) return res.redirect('/');

        // Basic Regex Search
        const searchResults = await Question.find({
            title: { $regex: query, $options: 'i' }
        }).limit(20);

        // Ideally, we might want to show a search results page. 
        // But based on the layout, it seems the sidebar handles navigation.
        // For now, let's redirect to the first result if found, or show home.
        if (searchResults.length > 0) {
            res.redirect(`/question/${searchResults[0]._id}`);
        } else {
             // Or render home with a flash message?
             // Since we don't have flash handled in the view strictly for search, just redirect home.
             res.redirect('/');
        }

    } catch (err) {
        console.error(err);
        res.redirect('/');
    }
});

module.exports = router;
