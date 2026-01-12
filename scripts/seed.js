const mongoose = require('mongoose');
const fs = require('fs');
const vm = require('vm');
const path = require('path');
const Question = require('../models/Question');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function seedDatabase() {
    try {
        if (!process.env.MONGODB_URI) {
            throw new Error("MONGODB_URI is missing in .env");
        }

        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB.');

        // Clear existing data? optional, but good for reliable seeding
        // console.log('Clearing existing questions...');
        // await Question.deleteMany({}); 
        // Uncomment above if you want to wipe the DB first. For now, let's just add if empty or just add.
        // Actually, preventing duplicates is better.

        console.log('Reading data.js...');
        const dataPath = path.join(__dirname, 'data.js');
        const code = fs.readFileSync(dataPath, 'utf8');
        
        const sandbox = {};
        vm.createContext(sandbox);

        // Modify code to use var instead of const so it attaches to the sandbox object
        const modifiedCode = code.replace('const dsaData', 'var dsaData');
        
        try {
            vm.runInContext(modifiedCode, sandbox);
        } catch (e) {
            console.error("Error executing data.js in VM:", e);
        }
        
        const dsaData = sandbox.dsaData;

        if (!dsaData) {
            console.error("dsaData could not be extracted.");
            process.exit(1);
        }
        let count = 0;

        for (const chapter in dsaData) {
            const questions = dsaData[chapter];
            console.log(`Processing chapter: ${chapter} (${questions.length} questions)`);

            for (const q of questions) {
                // Check if exists
                const exists = await Question.findOne({ title: q.name, chapter: chapter });
                if (!exists) {
                    await Question.create({
                        chapter: chapter,
                        title: q.name,
                        code: q.code,
                        output: q.output,
                        language: q.language || 'cpp'
                    });
                    count++;
                }
            }
        }

        console.log(`Successfully seeded ${count} new questions.`);
        process.exit(0);

    } catch (error) {
        console.error('Seeding error:', error);
        process.exit(1);
    }
}

seedDatabase();
