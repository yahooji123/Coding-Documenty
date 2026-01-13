require('dotenv').config();
const mongoose = require('mongoose');
const Admin = require('../models/Admin');

const createAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        // Check if admin already exists
        const existingAdmin = await Admin.findOne({ username: 'admin' });
        if (existingAdmin) {
            console.log('⚠️ Admin already exists: admin');
            process.exit(0);
        }

        const newAdmin = new Admin({
            username: 'admin',
            password: 'adminpassword123' // Yeh script run hone par hash ho jayega
        });

        await newAdmin.save();
        console.log('✅ Admin Created Successfully');
        console.log('Username: admin');
        console.log('Password: adminpassword123');
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

createAdmin();
