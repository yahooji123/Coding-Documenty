const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
    chapter: {
        type: String,
        required: true,
        trim: true
    },
    title: {
        type: String,
        required: true,
        trim: true
    },
    language: {
        type: String,
        required: true,
        enum: ['cpp', 'java', 'python', 'javascript'],
        default: 'cpp'
    },
    code: {
        type: String,
        required: true
    },
    output: {
        type: String,
        default: ''
    },
    difficulty: {
        type: String,
        enum: ['Easy', 'Medium', 'Hard'],
        default: 'Medium'
    },
    explanation: {
        type: String,
        default: ''
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Index for sidebar grouping and sorting
questionSchema.index({ chapter: 1, title: 1 });

module.exports = mongoose.model('Question', questionSchema);
