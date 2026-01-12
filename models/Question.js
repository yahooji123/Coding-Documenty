const mongoose = require('mongoose');

// Question Schema define kar rahe hain
const questionSchema = new mongoose.Schema({
    // Chapter ka naam (e.g., Array, String)
    chapter: {
        type: String,
        required: true,
        index: true // Search optimize karne ke liye
    },
    // Question ka title
    title: {
        type: String,
        required: true
    },
    // Solution code
    code: {
        type: String,
        required: true
    },
    // Output kya aayega
    output: {
        type: String,
        default: 'Output not specified.'
    },
    // Difficulty level (Easy, Medium, Hard)
    difficulty: {
        type: String,
        enum: ['Easy', 'Medium', 'Hard'],
        default: 'Medium'
    },
    // Tags for searching
    tags: {
        type: [String],
        default: []
    },
    // Programming language (default C++)
    language: {
        type: String,
        default: 'cpp'
    },
    // Explanation of solution
    explanation: {
        type: String,
        default: ''
    },
    // File name for download purposes
    fileName: {
        type: String
    },
    // Creation time
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Model export kar rahe hain taaki baaki jagah use kar sakein
module.exports = mongoose.model('Question', questionSchema);
